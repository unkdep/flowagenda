🚀 FlowAgenda

Sistema completo de agendamento desenvolvido com foco em produto real (SaaS).

O FlowAgenda resolve um problema comum em negócios que dependem de agenda: organização manual, conflitos de horário e baixa automação no processo de agendamento.



🧠 Problema

Negócios que trabalham com agendamentos frequentemente enfrentam:

- conflitos de horários
- controle manual da agenda
- dificuldade de escalar atendimentos
- falta de integração com outros sistemas



💡 Solução

O FlowAgenda foi projetado para centralizar e automatizar esse processo:

- gestão de agendamentos, clientes, profissionais e serviços
- API REST para integração com outros sistemas
- validação de conflitos de horário diretamente no backend
- endpoint de disponibilidade que retorna horários livres automaticamente
- base preparada para automações com webhooks
- arquitetura pensada para evolução com IA (chatbot + MCP)



⚙️ Tecnologias utilizadas

### Backend

- Python
- Django
- Django REST Framework
- SQLite (temporário)

### Frontend

- Next.js
- TypeScript
- CSS puro


🔗 API

Principais endpoints:

- GET /api/appointments/
- GET /api/professionals/
- GET /api/clients/
- GET /api/services/
- GET /api/availability/?professional_id=1&date=YYYY-MM-DD
- POST /api/book-appointment/



🚀 Como rodar o projeto

### Backend

cd backend
python -m venv venv

# Windows

venv\Scripts\activate

pip install -r requirements.txt
python manage.py runserver



### Frontend

cd frontend
npm install
npm run dev



🌐 Demo

https://flowagenda-six.vercel.app/



🔮 Próximas melhorias

- Integração com Google Calendar
- Integração com Google Meet
- Webhooks funcionais
- Chatbot para agendamentos automáticos
- MCP / IA para automação completa da agenda
- Melhorias de UX e performance



📌 Status do projeto

Em desenvolvimento
Backend funcional com regras de negócio
Frontend em evolução



📄 Licença

Projeto em desenvolvimento para fins de estudo e evolução profissional.
