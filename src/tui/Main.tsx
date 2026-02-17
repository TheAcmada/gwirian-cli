import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select, Spinner } from '@inkjs/ui';
import { createApiClient } from '../api.js';
import type { Project, Feature, Scenario } from '../api.js';
import { TokenInvalidOrExpiredError } from '../api.js';

type View = 'projects' | 'features' | 'scenarios';

interface MainAppProps {
  baseUrl: string;
  token: string;
}

export function MainApp({ baseUrl, token }: MainAppProps) {
  const [view, setView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const api = createApiClient(baseUrl, token);

  useEffect(() => {
    if (view === 'projects') {
      setLoading(true);
      setError(null);
      api
        .getProjects()
        .then(setProjects)
        .catch((e) => {
          if (e instanceof TokenInvalidOrExpiredError) {
            setError('Token invalid or expired. Run "gwirian auth" to set a new token.');
          } else {
            setError((e as Error).message);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [view, baseUrl, token]);

  useEffect(() => {
    if (view === 'features' && selectedProjectId) {
      setLoading(true);
      setError(null);
      api
        .getFeatures(selectedProjectId)
        .then(setFeatures)
        .catch((e) => {
          setError((e as Error).message);
        })
        .finally(() => setLoading(false));
    }
  }, [view, selectedProjectId, baseUrl, token]);

  useEffect(() => {
    if (view === 'scenarios' && selectedProjectId && selectedFeatureId) {
      setLoading(true);
      setError(null);
      api
        .getScenarios(selectedProjectId, selectedFeatureId)
        .then(setScenarios)
        .catch((e) => {
          setError((e as Error).message);
        })
        .finally(() => setLoading(false));
    }
  }, [view, selectedProjectId, selectedFeatureId, baseUrl, token]);

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">{error}</Text>
        <Text dimColor>Press Ctrl+C to exit.</Text>
      </Box>
    );
  }

  if (view === 'projects') {
    if (loading) {
      return (
        <Box padding={1}>
          <Spinner label="Loading projects" />
        </Box>
      );
    }
    if (projects.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text>No projects found.</Text>
        </Box>
      );
    }
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        <Text bold>Select a project</Text>
        <Select
          options={projects.map((p) => ({
            label: p.name,
            value: String(p.id),
          }))}
          onChange={(value: string) => {
            setSelectedProjectId(value);
            setView('features');
          }}
        />
      </Box>
    );
  }

  if (view === 'features') {
    if (loading) {
      return (
        <Box padding={1}>
          <Spinner label="Loading features" />
        </Box>
      );
    }
    if (features.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text>No features in this project.</Text>
          <Text dimColor>Press Ctrl+C to exit.</Text>
        </Box>
      );
    }
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        <Text bold>Select a feature</Text>
        <Select
          options={features.map((f) => ({
            label: f.title,
            value: String(f.id),
          }))}
          onChange={(value: string) => {
            setSelectedFeatureId(value);
            setView('scenarios');
          }}
        />
      </Box>
    );
  }

  if (view === 'scenarios') {
    if (loading) {
      return (
        <Box padding={1}>
          <Spinner label="Loading scenarios" />
        </Box>
      );
    }
    if (scenarios.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text>No scenarios in this feature.</Text>
          <Text dimColor>Press Ctrl+C to exit.</Text>
        </Box>
      );
    }
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        <Text bold>Scenarios</Text>
        {scenarios.map((s) => (
          <Box key={s.id} flexDirection="column" gap={0}>
            <Text bold>{s.title || `Scenario #${s.id}`}</Text>
            {s.given && <Text dimColor>Given: {s.given}</Text>}
            {s.when && <Text dimColor>When: {s.when}</Text>}
            {s.then && <Text dimColor>Then: {s.then}</Text>}
          </Box>
        ))}
        <Text dimColor>Press Ctrl+C to exit.</Text>
      </Box>
    );
  }

  return null;
}
