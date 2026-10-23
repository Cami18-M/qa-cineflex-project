# Guía de Git para el equipo (4 integrantes, un solo computador)

> Cómo iniciar el repositorio, organizar el trabajo de los 4 integrantes desde
> una única máquina y usar Git de forma segura hasta subir el proyecto a GitHub.

## 1. Reglas generales

- Trabajamos en **una sola carpeta** (`qa-cineflex-project/`) y **un solo repositorio**.
- Cada integrante es responsable de sus archivos (ver `PLAN_TRABAJO.md`).
- Antes de hacer un commit, revisar `git status` y `git diff` para no subir archivos ajenos.
- **Nunca** subir `node_modules/`, `.env` ni archivos con secretos (ya excluidos en `.gitignore`).
- No hacer `git push --force`, no borrar ramas remotas ni reescribir el historial.

## 2. Configuración inicial (una sola vez)

```bash
git config --global user.name "Nombre del Equipo"
git config --global user.email "correo@ejemplo.com"
```

## 3. Iniciar el repositorio local

```bash
cd qa-cineflex-project
git init
git add .
git commit -m "Entrega inicial del taller CineFlex"
```

## 4. Verificar lo que se va a subir

```bash
git status                # archivos modificados/nuevos
git diff                  # cambios en archivos ya seguidos
git log --oneline -10     # historial
```

## 5. Ramas (cuando sea necesario)

Aunque trabajamos en una sola máquina, podemos usar ramas por integrante para no
pisarnos:

```bash
# Crear y cambiarse a una rama propia
git checkout -b feature/integrante1-backend

# Trabajar, luego confirmar
git add backend/
git commit -m "backend: implementar login con JWT y bloqueo de intentos"

# Volver a main y fusionar
git checkout main
git merge feature/integrante1-backend
```

Si no se usan ramas, basta con commits frecuentes y descriptivos en `main`.

## 6. Ciclo de trabajo recomendado (por integrante)

1. `git pull` (si ya hay remoto) o coordinar con el equipo antes de editar.
2. Editar **solo los archivos de su responsabilidad**.
3. Ejecutar las pruebas que le correspondan (ver `PLAN_TRABAJO.md`).
4. `git add <archivos específicos>` (no `git add .` sin revisar).
5. `git commit -m "descripcion corta"`.
6. Compartir el estado con el equipo.

## 7. Subir el proyecto a GitHub (solo con autorización)

> **No ejecutar hasta que el equipo autorice publicar el repositorio.**

```bash
# 1. Crear un repositorio PUBLICO vacío en GitHub (sin README, sin .gitignore).
# 2. Vincularlo:
git remote add origin https://github.com/<USUARIO>/<REPOSITORIO>.git
git branch -M main

# 3. Subir:
git push -u origin main
```

## 8. Trabajo posterior (después del primer push)

```bash
git pull
# ... editar, probar, commit ...
git push
```

## 9. Acciones a evitar (resumen)

- `git push --force` / `git push -f`.
- `git reset --hard` sin copia de seguridad.
- Borrar ramas remotas (`git push origin --delete`).
- Hacer commit de `node_modules/`, `.env`, capturas temporales o resultados JMeter.
- Publicar remotamente sin autorización del equipo.
