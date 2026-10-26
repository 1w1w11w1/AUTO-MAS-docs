# API Development Process

## 1. Define Data Models

Define data models in `app/models/schema.py`.

```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    param1: str
    param2: int

class MyResponse(BaseModel):
    success: bool
    data: dict
```

## 2. Create an API Route

**Create the route in the corresponding module under `app/api/`.**

```python
from fastapi import APIRouter
from app.models.schema import MyRequest, MyResponse

router = APIRouter()

@router.post("/my-endpoint", response_model=MyResponse)
async def my_endpoint(request: MyRequest):
    # Business logic
    return MyResponse(success=True, data={})
```

## 3. Generate Frontend Code

1. **Start the backend**

Complete [backend environment setup](./getting-start.md#_2-backend-environment-setup) first: create the root `.env` marker and run `uv sync --locked`. From the repository root, run:

::: code-group

```powershell [PowerShell]
uv run --locked python main.py
```

```bash [Bash]
uv run --locked python main.py
```

:::

Keep the backend running. Development defaults to port `36164`; `yarn openapi` reads the API definition from `http://127.0.0.1:36164/openapi.json`.

2. **Generate frontend code with openapi-generator-typescript**

Open another terminal at the repository root:

::: code-group

```powershell [PowerShell]
cd frontend
yarn openapi
```

```bash [Bash]
cd frontend
yarn openapi
```

:::

If there is no output, generation has completed. If an error occurs, read the error message.

::: warning Note
`frontend/src/api` is maintained by the OpenAPI generator. After backend schema or API contract changes, regenerate this directory. Do not manually edit generated files to fix types or interfaces.
:::

::: warning Note
When debugging a new API, connect to the local backend running from your current checkout. Running `yarn dev` alone does not execute the uv sync or local backend startup commands above. Follow [Start Backend and Frontend Separately](./getting-start.md#_4-1-start-backend-and-frontend-separately), or use the combined startup command on that page.
:::

## 4. Call the API from the Frontend

Frontend business code should not call the generated `Service.ts` directly across page components. First wrap business-oriented composables in `frontend/src/composables`, then call those composables from pages or components.

The generated `frontend/src/api/services/Service.ts` should be used only as the low-level API client:

```typescript
import { Service } from '@/api';

export function useMyApi() {
    const submitMyRequest = async (param1: string, param2: number) => {
        return Service.myEndpoint({
            param1,
            param2,
        });
    };

    return {
        submitMyRequest,
    };
}
```

Page components should focus on interaction, loading states, error messages, and data display. API parameter preparation, response compatibility handling, and reusable logic should stay inside composables.
