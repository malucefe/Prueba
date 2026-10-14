# n8n para Render: solo la imagen oficial, sin build de código propio.
FROM n8nio/n8n:latest

# Render asigna un puerto aleatorio por instancia en $PORT (el proxy solo
# enruta a ese puerto), mientras n8n escucha en N8N_PORT (5678 por defecto
# fuera de Render). El CMD en forma exec NO expande ${...} en el build:
# la expansión la hace sh en tiempo de ejecución dentro del contenedor.
CMD ["/bin/sh", "-c", "N8N_PORT=${PORT:-5678} exec n8n start"]
