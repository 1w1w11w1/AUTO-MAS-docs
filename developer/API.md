# API 开发流程

## 1. 定义数据模型

在 `app/models/schema.py` 中定义数据模型


```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    param1: str
    param2: int

class MyResponse(BaseModel):
    success: bool
    data: dict
```

## 2. 创建 API 路由

**在 `app/api/` 对应模块中创建路由**

```python
from fastapi import APIRouter
from app.models.schema import MyRequest, MyResponse

router = APIRouter()

@router.post("/my-endpoint", response_model=MyResponse)
async def my_endpoint(request: MyRequest):
    # 业务逻辑
    return MyResponse(success=True, data={})
```

## 3. 生成前端代码

1. **启动后端**

先完成 [后端环境搭建](./getting-start.md#_2-后端环境搭建)，确保仓库根目录已有 `.env`，并已执行 `uv sync --locked`。在仓库根目录运行：

::: code-group

```powershell [PowerShell]
uv run --locked python main.py
```

```bash [Bash]
uv run --locked python main.py
```

:::

保持后端运行。开发环境默认使用 `36164` 端口，`yarn openapi` 从 `http://127.0.0.1:36164/openapi.json` 读取接口定义。

2. **使用 openapi-generator-typescript 生成前端代码**

另开一个终端，在仓库根目录执行：

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
如果没有输出，代表已经生成完成了；如果报错了，请自行查阅报错内容。

::: warning 注意
`frontend/src/api` 由 OpenAPI 生成器维护。后端 schema 或 API 契约变更后，只能重新生成该目录，不要为了修类型或接口手动修改生成文件。
:::

::: warning 注意
调试新 API 时，应连接当前检出代码启动的本地后端。仅运行 `yarn dev` 不会执行上述 uv 环境同步和本地后端启动命令。请按 [分别启动后端与前端](./getting-start.md#_4-1-分别启动后端与前端) 操作，或使用该页的一次启动方式。
:::

##  4. 在前端调用 API

前端业务代码不要在页面组件中直接散落调用生成的 `Service.ts`。应先在 `frontend/src/composables` 中封装面向业务的 composable，再由页面或组件调用该 composable。

生成的 `frontend/src/api/services/Service.ts` 只作为底层 API 客户端使用：

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

页面组件只负责组织交互、加载态、错误提示和数据展示；API 参数整理、响应兼容处理和复用逻辑放在 composable 中。
