# IkigotchiGarden Backend

A FastAPI backend for the IkigotchiGarden plant care app using layered architecture.

## Architecture

The backend follows a clean layered architecture pattern:

```
app/
├── controller/           # API Routes & Request Handling
│   ├── plant_data_controller.py
│   └── user_plant_controller.py
├── service/             # Business Logic Layer
│   ├── plant_data_service.py  
│   └── user_plant_service.py
├── repository/          # Data Access Layer
│   ├── plant_data_repository.py
│   └── user_plant_repository.py
├── dto/                 # Data Transfer Objects
│   └── __init__.py
└── model/              # Domain Models
    └── __init__.py
```

## Features

- **Clean Architecture**: Controller → Service → Repository pattern
- **User Plants CRUD**: Manage user's personal plant collection
- **Plant Database CRUD**: Manage plant species information including scientific names, fun facts, and watering periods
- **Search Functionality**: Find plants by name
- **CORS Enabled**: Ready for React Native frontend integration
- **Type Safety**: Full Pydantic model validation

## API Endpoints

### User Plants
- `GET /api/user-plants` - Get all user plants
- `GET /api/user-plants/{id}` - Get specific user plant
- `POST /api/user-plants` - Create new user plant
- `PUT /api/user-plants/{id}` - Update user plant
- `DELETE /api/user-plants/{id}` - Delete user plant

### Plant Database
- `GET /api/plants` - Get all plants from database
- `GET /api/plants/{id}` - Get specific plant
- `GET /api/plants/search/{name}` - Search plant by name
- `POST /api/plants` - Create new plant entry
- `PUT /api/plants/{id}` - Update plant entry
- `DELETE /api/plants/{id}` - Delete plant entry

## Setup

1. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

2. Activate virtual environment:
```bash
source venv/bin/activate
```

3. Start the server:
```bash
python main.py
```

Or with auto-reload for development:
```bash
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

## API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:3001/docs
- **OpenAPI Schema**: http://localhost:3001/openapi.json

## Sample Data

The backend comes with pre-populated plant data including:
- Snake Plant (Sansevieria trifasciata)
- Monstera (Monstera deliciosa)
- Fiddle Leaf Fig (Ficus lyrata)
- Pothos (Epipremnum aureum)
- Peace Lily (Spathiphyllum wallisii)
- Rubber Plant (Ficus elastica)
- Spider Plant (Chlorophytum comosum)

Each entry includes scientific name, fun facts, and recommended watering periods.

## Architecture Benefits

- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Easy to unit test individual components
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Easy to add new features or change data sources