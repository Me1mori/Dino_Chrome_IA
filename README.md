# 🦖 Dino con IA

Una versión del clásico juego del dinosaurio de Google Chrome, ahora con inteligencia artificial.  
Este proyecto permite jugar manualmente o dejar que una IA aprenda a esquivar los obstáculos.

---

## 🚀 Características

- ✅ Modo manual y automático (IA).
- 🧠 Red neuronal visualizada en tiempo real.
- 🔊 Efectos de sonido similares al juego original.
- 🎮 Jugabilidad responsive en navegador.
- 🖋️ Fuente estilo retro: *Press Start 2P*.

---

## 📁 Estructura del proyecto

```
DINO_CON_IA/
│
├── LICENSE               # Licencia MIT personalizada
├── README.md             # Documentación del proyecto
├── vercel.json           # Configuración para desplegar en Vercel
├── .gitignore            # Ignora archivos innecesarios para Git
│
├── backend/
│   ├── app.py                      # Servidor Flask principal
│   ├── requirements.txt            # Dependencias de Python
│   │
│   ├── static/
│   │   ├── css/                    # Estilos del juego
│   │   ├── fonts/                  # Tipografías usadas
│   │   ├── img/                    # Imágenes como sprites
│   │   ├── js/
│   │   │   ├── game.js             # Lógica del juego
│   │   │   └── ai.js               # Inteligencia artificial del Dino
│   │   └── sounds/                 # Efectos de sonido
│   │
│   └── templates/
│       └── index.html             # Página principal renderizada por Flask
```

---

## 🧠 ¿Cómo ejecutar el juego localmente?

1. Instala Python 3.11.* (si no lo tienes ya).
2. Instala Flask:

```bash
pip install flask
```

3. Ejecuta el servidor:

```bash
python backend/app.py
```

4. Abre tu navegador en:  
👉 `http://localhost:5000`

---

## 🎮 Controles

- **Espacio / ↑**: Saltar  
- **↓**: Agacharse (si está habilitado)  
- **Botón IA**: Activar/desactivar IA  
- **Botón Reiniciar**: Comenzar una nueva partida

---

## 📜 Licencia

> ⚖️ **Licencia**  
> El código fuente de este proyecto está disponible bajo la **Licencia MIT** (ver archivo `LICENSE`).

> ❗ **Los sprites y sonidos originales son propiedad de Google** y **no están cubiertos por la licencia MIT**.  
> Se incluyen únicamente con fines educativos y de prueba.  
> Si planeas redistribuir o publicar este juego, reemplázalos por tus propios recursos.

---

## 📬 Contacto

Proyecto creado por **Me1mori**.
