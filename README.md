# AI Asset Marketplace (Frontend & Backend)

Этот проект состоит из **Backend (FastAPI)** и **Frontend (React/Vite)**. Для полноценной работы необходимо запустить обе части.

## 1. Запуск Backend (Python)
1. Установите зависимости в папке `backend`:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Убедитесь, что в файле `.env` указан ваш `GROQ_API_KEY`.
3. Запустите сервер:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Backend будет доступен по адресу: http://127.0.0.1:8000*

---

## 2. Запуск Frontend (React)
1. В корневой папке проекта (где находится `package.json`):
   ```bash
   npm install
   npm run dev
   ```
2. Откройте в браузере: http://localhost:5173

---

### Основные функции:
- **AI Search**: Умный поиск по всей структуре сайта (через Groq).
- **AI Metadata**: Автогенерация заголовков и описаний при загрузке ассетов.
- **Profile Dashboard**: Личный кабинет с реальной статистикой и балансом.
