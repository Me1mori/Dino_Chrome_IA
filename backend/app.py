from flask import Flask, render_template, request, jsonify
import os

app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    # Detectar si estamos en producción (por ejemplo, en Vercel)
    if os.environ.get("VERCEL") == "1":
        # Producción: solo define la app, no la ejecutes aquí
        pass
    else:
        # Desarrollo local
        app.run(debug=True, host="127.0.0.1", port=5000)
