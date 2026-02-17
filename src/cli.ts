import { createInterface } from 'readline';
import { createApiClient, TokenInvalidOrExpiredError, ApiError } from './api.js';
import { getConfig, setToken, setBaseUrl, clearToken, hasToken } from './config.js';
import { formatJson, formatList, formatRichTable, formatError } from './format.js';
import type { CreateFeatureBody, UpdateFeatureBody } from './api.js';
import type { CreateScenarioBody, UpdateScenarioBody } from './api.js';
import type { CreateScenarioExecutionBody, UpdateScenarioExecutionBody } from './api.js';
import { program } from 'commander';

const AUTH_REQUIRED_MSG =
  'No token configured. Run "gwirian auth" to set your API token.';

function printError(
  message: string,
  options: { title?: string; statusCode?: number } = {}
): void {
  if (process.stderr.isTTY) {
    console.error(formatError(message, options));
  } else {
    console.error(message);
  }
}

function getBaseUrlAndToken(baseUrlOverride?: string): {
  baseUrl: string;
  token: string | null;
} {
  const config = getConfig();
  return {
    baseUrl: baseUrlOverride ?? config.baseUrl,
    token: config.token,
  };
}

function requireToken(baseUrlOverride?: string): {
  baseUrl: string;
  token: string;
} {
  const { baseUrl, token } = getBaseUrlAndToken(baseUrlOverride);
  if (!token) {
    printError(AUTH_REQUIRED_MSG, { title: 'Auth required' });
    process.exit(1);
  }
  return { baseUrl, token };
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function output(data: unknown, useJson: boolean, listColumns?: string[]): void {
  if (useJson) {
    console.log(formatJson(data));
    return;
  }
  if (Array.isArray(data) && listColumns && listColumns.length > 0) {
    const items = data as Record<string, unknown>[];
    const table =
      process.stdout.isTTY && items.length > 0
        ? formatRichTable(items, listColumns)
        : formatList(items, listColumns);
    if (table) console.log(table);
    return;
  }
  console.log(formatJson(data));
}

program
  .name('gwirian')
  .description('CLI for Gwirian API with modern TUI')
  .option('--base-url <url>', 'Override base URL for this run')
  .option('--json', 'Output raw JSON')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.baseUrl) (thisCommand as unknown as { _baseUrlOverride?: string })._baseUrlOverride = opts.baseUrl;
    if (opts.json) (thisCommand as unknown as { _useJson?: boolean })._useJson = true;
  });

program
  .command('auth')
  .description('Set API token (prompted, optionally test connection)')
  .option('-t, --test', 'Test token with a projects request')
  .action(async (opts: { test?: boolean }) => {
    const token = await ask('Token: ');
    if (!token) {
      printError('Token cannot be empty.', { title: 'Auth' });
      process.exit(1);
    }
    setToken(token);
    console.log('Token saved.');
    if (opts.test) {
      const api = createApiClient(getConfig().baseUrl, token);
      try {
        await api.getProjects();
        console.log('Connection successful.');
      } catch (e) {
        if (e instanceof TokenInvalidOrExpiredError) {
          printError('Token is invalid or expired.', { title: 'Auth' });
        } else {
          printError(`Connection failed: ${(e as Error).message}`, { title: 'Connection failed' });
        }
        process.exit(1);
      }
    }
  });

program
  .command('logout')
  .description('Clear stored API token')
  .action(() => {
    clearToken();
    console.log('Token cleared.');
  });

program
  .command('config')
  .description('View or set configuration')
  .addCommand(
    program.createCommand('get').description('Show base URL and token status').action(() => {
      const config = getConfig();
      console.log('Base URL:', config.baseUrl);
      console.log('Token:', hasToken() ? 'set' : 'not set');
    })
  )
  .addCommand(
    program
      .createCommand('set')
      .description('Set a config value')
      .addCommand(
        program
          .createCommand('base-url')
          .description('Set API base URL')
          .argument('<url>', 'API base URL')
          .action((url: string) => {
            setBaseUrl(url);
            console.log('Base URL set to:', url);
          })
      )
  );

// Projects
program
  .command('projects')
  .description('List or show projects')
  .addCommand(
    program
      .createCommand('list')
      .description('List projects')
      .action(async () => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const projects = await api.getProjects();
          output(projects, useJson, ['id', 'name', 'description']);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('show')
      .description('Show project details')
      .argument('<project-id>', 'Project ID')
      .action(async (projectId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const project = await api.getProject(projectId);
          output(project, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  );

function handleApiError(e: unknown): void {
  if (e instanceof TokenInvalidOrExpiredError) {
    printError('Token invalid or expired. Run "gwirian auth" to set a new token.', { title: 'Auth' });
  } else if (e instanceof ApiError) {
    const title = e.statusCode === 404 ? 'Not found' : e.statusCode === 403 ? 'Forbidden' : 'Error';
    printError(e.message, { title, statusCode: e.statusCode });
  } else {
    printError((e as Error).message, { title: 'Error' });
  }
  process.exit(1);
}

// Scenarios
program
  .command('scenarios')
  .description('List, show, create, update, or delete scenarios')
  .addCommand(
    program
      .createCommand('list')
      .description('List scenarios')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .action(async (projectId: string, featureId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const list = await api.getScenarios(projectId, featureId);
          output(list, useJson, ['id', 'title', 'given', 'when', 'then']);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('show')
      .description('Show scenario')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .action(async (projectId: string, featureId: string, scenarioId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const s = await api.getScenario(projectId, featureId, scenarioId);
          output(s, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('create')
      .description('Create scenario')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .option('--title <title>', 'Title')
      .option('--given <given>', 'Given')
      .option('--when <when>', 'When')
      .option('--then <then>', 'Then')
      .option('--position <n>', 'Position', parseInt)
      .action(async (projectId: string, featureId: string, opts: CreateScenarioBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const s = await api.createScenario(projectId, featureId, opts);
          output(s, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('update')
      .description('Update scenario')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .option('--title <title>', 'Title')
      .option('--given <given>', 'Given')
      .option('--when <when>', 'When')
      .option('--then <then>', 'Then')
      .option('--position <n>', 'Position', parseInt)
      .action(async (projectId: string, featureId: string, scenarioId: string, opts: UpdateScenarioBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const s = await api.updateScenario(projectId, featureId, scenarioId, opts);
          output(s, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('delete')
      .description('Delete scenario')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .action(async (projectId: string, featureId: string, scenarioId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        try {
          const api = createApiClient(baseUrl, token);
          await api.deleteScenario(projectId, featureId, scenarioId);
          console.log('Scenario deleted.');
        } catch (e) {
          handleApiError(e);
        }
      })
  );

// Scenario executions
program
  .command('scenario-executions')
  .description('List, show, create, update, or delete scenario executions')
  .addCommand(
    program
      .createCommand('list')
      .description('List scenario executions')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .action(async (projectId: string, featureId: string, scenarioId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const list = await api.getScenarioExecutions(projectId, featureId, scenarioId);
          output(list, useJson, ['id', 'status', 'notes', 'executed_at']);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('show')
      .description('Show scenario execution')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .argument('<execution-id>', 'Execution ID')
      .action(async (projectId: string, featureId: string, scenarioId: string, executionId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const e = await api.getScenarioExecution(projectId, featureId, scenarioId, executionId);
          output(e, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('create')
      .description('Create scenario execution')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .option('--status <status>', 'Status')
      .option('--notes <notes>', 'Notes')
      .option('--executed-at <iso>', 'Executed at (ISO date)')
      .action(async (projectId: string, featureId: string, scenarioId: string, opts: CreateScenarioExecutionBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const e = await api.createScenarioExecution(projectId, featureId, scenarioId, opts);
          output(e, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('update')
      .description('Update scenario execution')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .argument('<execution-id>', 'Execution ID')
      .option('--status <status>', 'Status')
      .option('--notes <notes>', 'Notes')
      .option('--executed-at <iso>', 'Executed at (ISO date)')
      .action(async (projectId: string, featureId: string, scenarioId: string, executionId: string, opts: UpdateScenarioExecutionBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const e = await api.updateScenarioExecution(projectId, featureId, scenarioId, executionId, opts);
          output(e, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('delete')
      .description('Delete scenario execution')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .argument('<scenario-id>', 'Scenario ID')
      .argument('<execution-id>', 'Execution ID')
      .action(async (projectId: string, featureId: string, scenarioId: string, executionId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        try {
          const api = createApiClient(baseUrl, token);
          await api.deleteScenarioExecution(projectId, featureId, scenarioId, executionId);
          console.log('Scenario execution deleted.');
        } catch (e) {
          handleApiError(e);
        }
      })
  );

// Features must be added after scenarios so "features" is not shadowed
program
  .command('features')
  .description('List, show, create, update, or delete features')
  .addCommand(
    program
      .createCommand('list')
      .description('List features')
      .argument('<project-id>', 'Project ID')
      .action(async (projectId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const list = await api.getFeatures(projectId);
          output(list, useJson, ['id', 'title', 'description']);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('show')
      .description('Show feature')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .action(async (projectId: string, featureId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const f = await api.getFeature(projectId, featureId);
          output(f, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('create')
      .description('Create feature')
      .argument('<project-id>', 'Project ID')
      .option('--title <title>', 'Title')
      .option('--description <desc>', 'Description')
      .option('--tag-list <tags>', 'Tag list')
      .action(async (projectId: string, opts: CreateFeatureBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const f = await api.createFeature(projectId, opts);
          output(f, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('update')
      .description('Update feature')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .option('--title <title>', 'Title')
      .option('--description <desc>', 'Description')
      .option('--tag-list <tags>', 'Tag list')
      .action(async (projectId: string, featureId: string, opts: UpdateFeatureBody) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        const useJson = (program as unknown as { _useJson?: boolean })._useJson ?? false;
        try {
          const api = createApiClient(baseUrl, token);
          const f = await api.updateFeature(projectId, featureId, opts);
          output(f, useJson);
        } catch (e) {
          handleApiError(e);
        }
      })
  )
  .addCommand(
    program
      .createCommand('delete')
      .description('Delete feature')
      .argument('<project-id>', 'Project ID')
      .argument('<feature-id>', 'Feature ID')
      .action(async (projectId: string, featureId: string) => {
        const { baseUrl, token } = requireToken(
          (program as unknown as { _baseUrlOverride?: string })._baseUrlOverride
        );
        try {
          const api = createApiClient(baseUrl, token);
          await api.deleteFeature(projectId, featureId);
          console.log('Feature deleted.');
        } catch (e) {
          handleApiError(e);
        }
      })
  );

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    if (process.stdin.isTTY) {
      const { runTui } = await import('./runTui.js');
      await runTui();
      return;
    }
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
