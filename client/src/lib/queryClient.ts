import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 设置 API 基础地址
// const BASE_URL = 'https://otc.beingfi.com';
const BASE_URL = 'https://test-otc-api.beingfi.com';

// 导出 BASE_URL 供其他模块使用
export { BASE_URL };

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  data?: T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  data?: unknown | FormData | undefined,
): Promise<T> {
  const isFormData = data instanceof FormData;
  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';
  
  const headers: HeadersInit = {};
  let requestData = data;
  let url = `${BASE_URL}${endpoint}`;

  // 所有接口都尝试添加 token（如果本地有 token 的话）
  // 优先使用 otcUserToken，如果没有则尝试 merchantToken（商户后台）
  const token = localStorage.getItem('otcUserToken') || localStorage.getItem('merchantToken');
  if (token) {
    if (isGetOrHead) {
      // GET/HEAD 请求：将 token 作为查询参数
      const separator = endpoint.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    } else if (isFormData) {
      // 如果是 FormData，直接追加 token
      (data as FormData).append('token', token);
    } else {
      // 如果是普通对象，合并 token
      requestData = {
        ...(data as object || {}),
        token
      };
    }
  }

  // 处理请求体和 Content-Type
  // GET/HEAD 请求不能有 body
  let body: BodyInit | undefined;
  if (!isGetOrHead && requestData) {
    if (isFormData) {
      body = requestData as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(requestData);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "omit",
  });

  const result = await res.json();

  // 处理响应状态
  if (!res.ok) {
    throw new Error(result?.msg || result?.message || "请求失败");
  }

  // 处理业务状态码
  // 所有接口都返回 code === 0 表示成功，code === -1 表示失败
  if (result.code !== undefined && result.code !== 0) {
    // 处理未登录或会话过期的情况
    if (result.code === -1 && result.msg === '未知用户') {
      // 清除本地存储的 token
      localStorage.clear();
      // 使用 replace 而不是 href，这样用户点击返回时不会回到需要认证的页面
      window.location.replace('/auth');
      return result as T;
    }
    // 处理其他业务错误（code === -1 或其他非0值）
    throw new Error(result?.msg || result?.message || "请求失败");
  }

  return result as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// 重新实现 getQueryFn，使用 apiRequest
export const getQueryFn = <T,>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    try {
      const endpoint = queryKey[0] as string;
      const result = await apiRequest<T>('GET', endpoint);
      return result;
    } catch (error: any) {
      if (error.message?.includes('401') && options.on401 === "returnNull") {
        throw new Error('Unauthorized');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30秒
    },
    mutations: {
      retry: 3,
    },
  },
});
