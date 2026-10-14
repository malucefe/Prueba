import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';
import { User } from '../users/entities/user.entity';

export interface TransactionsTotals {
  total: number;
  ingresos: number;
  egresos: number;
}

export interface DailyTransactions {
  fecha: string;
  ingresos: number;
  egresos: number;
}

export interface MetricsResponse {
  desde: string;
  hasta: string;
  usuariosTotales: number;
  usuariosActivos: number;
  transacciones: TransactionsTotals;
  recomendacionesGeneradas: number;
  transaccionesPorDia: DailyTransactions[];
}

type DailyAccumulator = { ingresos: number; egresos: number };

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Recommendation)
    private readonly recommendationsRepository: Repository<Recommendation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Métricas globales de uso (HU-21) para el período [desde, hasta].
   * Los volúmenes son de demo, así que se consulta con Between y se agrega
   * en JS: sin SQL crudo, fácil de probar con mocks de repositorio.
   */
  async getMetrics(desde: string, hasta: string): Promise<MetricsResponse> {
    // Between exige Date en columnas de fecha (Tipos de TypeORM), así que las
    // cadenas YYYY-MM-DD ya validadas por el controller se convierten una vez.
    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);
    // createdAt es timestamp (CreateDateColumn): un Between hasta hastaDate
    // (medianoche UTC) excluiría todo el día "hasta". Se cuenta hasta el inicio
    // del día siguiente, exclusive.
    const finExclusivo = new Date(hastaDate.getTime() + 24 * 60 * 60 * 1000);

    const [transactions, recomendacionesGeneradas, usuariosTotales] =
      await Promise.all([
        this.transactionsRepository.find({
          where: { fecha: Between(desdeDate, hastaDate) },
        }),
        this.recommendationsRepository.count({
          where: {
            createdAt: And(
              MoreThanOrEqual(desdeDate),
              LessThan(finExclusivo),
            ),
          },
        }),
        this.usersRepository.count(),
      ]);

    let ingresos = 0;
    let egresos = 0;
    const usuariosActivos = new Set<string>();
    const porDia = new Map<string, DailyAccumulator>();

    for (const transaction of transactions) {
      const monto = Number(transaction.monto);
      usuariosActivos.add(transaction.userId);

      const fecha = this.toDayKey(transaction.fecha);
      const acumulado = porDia.get(fecha) ?? { ingresos: 0, egresos: 0 };

      if (transaction.tipo === TransactionType.INGRESO) {
        ingresos += monto;
        acumulado.ingresos += monto;
      } else if (transaction.tipo === TransactionType.EGRESO) {
        egresos += monto;
        acumulado.egresos += monto;
      }

      porDia.set(fecha, acumulado);
    }

    const transaccionesPorDia = [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, acumulado]) => ({
        fecha,
        ingresos: this.roundMoney(acumulado.ingresos),
        egresos: this.roundMoney(acumulado.egresos),
      }));

    return {
      desde,
      hasta,
      usuariosTotales,
      usuariosActivos: usuariosActivos.size,
      transacciones: {
        total: transactions.length,
        ingresos: this.roundMoney(ingresos),
        egresos: this.roundMoney(egresos),
      },
      recomendacionesGeneradas,
      transaccionesPorDia,
    };
  }

  /**
   * Columna `date` de Postgres: el driver la entrega como Date en medianoche
   * UTC, así que la clave del día sale del lado UTC para no correr la fecha
   * según la zona horaria del servidor.
   */
  private toDayKey(fecha: Date | string): string {
    if (typeof fecha === 'string') {
      return fecha.slice(0, 10);
    }
    return fecha.toISOString().slice(0, 10);
  }

  /** Sumas en decimal: sin redondeo, 0.1 + 0.2 queda en 0.30000000000000004. */
  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

