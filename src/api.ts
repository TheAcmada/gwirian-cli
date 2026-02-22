export class TokenInvalidOrExpiredError extends Error {
  constructor(message = 'Token invalid or expired') {
    super(message);
    this.name = 'TokenInvalidOrExpiredError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  type: 'feature' | 'scenario';
  id: number;
  title: string;
  description?: string | null;
  project_id?: number;
  feature_id?: number;
  feature_title?: string;
  status?: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  project_id: number;
}

export interface Scenario {
  id: number;
  title: string;
  given: string | null;
  when: string | null;
  then: string | null;
  position: number;
  feature_id: number;
  created_at: string;
  updated_at: string;
}

export interface ScenarioExecution {
  id: number;
  scenario_id: number;
  user_id: number;
  status: string | null;
  notes: string | null;
  executed_at: string | null;
  tag_list?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateFeatureBody {
  title?: string;
  description?: string;
  tag_list?: string;
}

export interface UpdateFeatureBody {
  title?: string;
  description?: string;
  tag_list?: string;
}

export interface CreateScenarioBody {
  title?: string;
  given?: string;
  when?: string;
  then?: string;
  position?: number;
}

export interface UpdateScenarioBody {
  title?: string;
  given?: string;
  when?: string;
  then?: string;
  position?: number;
}

export interface CreateScenarioExecutionBody {
  status?: string;
  notes?: string;
  executed_at?: string;
  tag_list?: string;
}

export interface UpdateScenarioExecutionBody {
  status?: string;
  notes?: string;
  executed_at?: string;
  tag_list?: string;
}

export function createApiClient(baseUrl: string, token: string) {
  const base = baseUrl.replace(/\/$/, '');
  const prefix = `${base}/api/v1`;

  async function request<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${prefix}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json: unknown;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    if (res.status === 401) {
      throw new TokenInvalidOrExpiredError();
    }

    if (!res.ok) {
      const message =
        typeof json === 'object' && json !== null && 'error' in json
          ? String((json as { error: unknown }).error)
          : `Request failed: ${res.status} ${res.statusText}`;
      throw new ApiError(message, res.status, json);
    }

    return json as T;
  }

  return {
    // Projects
    getProjects(): Promise<Project[]> {
      return request<Project[]>('GET', '/projects');
    },
    getProject(projectId: string | number): Promise<Project> {
      return request<Project>('GET', `/projects/${projectId}`);
    },
    searchProject(
      projectId: string | number,
      query: string,
      limit?: number
    ): Promise<{ results: SearchResult[] }> {
      let path = `/projects/${projectId}/search?q=${encodeURIComponent(query)}`;
      if (limit != null) path += `&limit=${limit}`;
      return request<{ results: SearchResult[] }>('GET', path);
    },

    // Features
    getFeatures(projectId: string | number): Promise<Feature[]> {
      return request<Feature[]>('GET', `/projects/${projectId}/features`);
    },
    getFeature(
      projectId: string | number,
      featureId: string | number
    ): Promise<Feature> {
      return request<Feature>(
        'GET',
        `/projects/${projectId}/features/${featureId}`
      );
    },
    createFeature(
      projectId: string | number,
      body: CreateFeatureBody
    ): Promise<Feature> {
      return request<Feature>('POST', `/projects/${projectId}/features`, {
        feature: body,
      });
    },
    updateFeature(
      projectId: string | number,
      featureId: string | number,
      body: UpdateFeatureBody
    ): Promise<Feature> {
      return request<Feature>(
        'PATCH',
        `/projects/${projectId}/features/${featureId}`,
        { feature: body }
      );
    },
    deleteFeature(
      projectId: string | number,
      featureId: string | number
    ): Promise<{ message?: string }> {
      return request(
        'DELETE',
        `/projects/${projectId}/features/${featureId}`
      );
    },

    // Scenarios
    getScenarios(
      projectId: string | number,
      featureId: string | number
    ): Promise<Scenario[]> {
      return request<Scenario[]>(
        'GET',
        `/projects/${projectId}/features/${featureId}/scenarios`
      );
    },
    getScenario(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number
    ): Promise<Scenario> {
      return request<Scenario>(
        'GET',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}`
      );
    },
    createScenario(
      projectId: string | number,
      featureId: string | number,
      body: CreateScenarioBody
    ): Promise<Scenario> {
      return request<Scenario>(
        'POST',
        `/projects/${projectId}/features/${featureId}/scenarios`,
        { scenario: body }
      );
    },
    updateScenario(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number,
      body: UpdateScenarioBody
    ): Promise<Scenario> {
      return request<Scenario>(
        'PATCH',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}`,
        { scenario: body }
      );
    },
    deleteScenario(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number
    ): Promise<{ message?: string }> {
      return request(
        'DELETE',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}`
      );
    },

    // Scenario executions
    getScenarioExecutions(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number
    ): Promise<ScenarioExecution[]> {
      return request<ScenarioExecution[]>(
        'GET',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}/scenario_executions`
      );
    },
    getScenarioExecution(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number,
      executionId: string | number
    ): Promise<ScenarioExecution> {
      return request<ScenarioExecution>(
        'GET',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}/scenario_executions/${executionId}`
      );
    },
    createScenarioExecution(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number,
      body: CreateScenarioExecutionBody
    ): Promise<ScenarioExecution> {
      return request<ScenarioExecution>(
        'POST',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}/scenario_executions`,
        { scenario_execution: body }
      );
    },
    updateScenarioExecution(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number,
      executionId: string | number,
      body: UpdateScenarioExecutionBody
    ): Promise<ScenarioExecution> {
      return request<ScenarioExecution>(
        'PATCH',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}/scenario_executions/${executionId}`,
        { scenario_execution: body }
      );
    },
    deleteScenarioExecution(
      projectId: string | number,
      featureId: string | number,
      scenarioId: string | number,
      executionId: string | number
    ): Promise<{ message?: string }> {
      return request(
        'DELETE',
        `/projects/${projectId}/features/${featureId}/scenarios/${scenarioId}/scenario_executions/${executionId}`
      );
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
