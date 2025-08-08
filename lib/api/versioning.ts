import { NextRequest } from 'next/server';

/**
 * API Version Configuration
 */
export const API_VERSIONS = {
  v1: '1.0',
  v2: '2.0',
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;

export const DEFAULT_API_VERSION: ApiVersion = 'v1';
export const LATEST_API_VERSION: ApiVersion = 'v2';

/**
 * Extract API version from request
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  // Check URL path for version
  const path = request.nextUrl.pathname;
  const pathMatch = path.match(/\/api\/(v\d+)\//);
  if (pathMatch && pathMatch[1] in API_VERSIONS) {
    return pathMatch[1] as ApiVersion;
  }

  // Check Accept header for version
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.labsync\.(v\d+)\+json/);
    if (versionMatch && versionMatch[1] in API_VERSIONS) {
      return versionMatch[1] as ApiVersion;
    }
  }

  // Check custom header for version
  const apiVersionHeader = request.headers.get('x-api-version');
  if (apiVersionHeader && apiVersionHeader in API_VERSIONS) {
    return apiVersionHeader as ApiVersion;
  }

  // Default to v1 for backward compatibility
  return DEFAULT_API_VERSION;
}

/**
 * Version-specific response transformers
 */
export const responseTransformers = {
  v1: {
    project: (data: any) => ({
      // V1 uses "study" terminology for backward compatibility
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      bucket: data.bucket,
      lab: data.lab,
      assignees: data.members,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }),
  },
  v2: {
    project: (data: any) => ({
      // V2 uses proper "project" terminology
      id: data.id,
      name: data.name,
      description: data.description,
      oraNumber: data.oraNumber,
      status: data.status,
      priority: data.priority,
      projectType: data.projectType,
      studyType: data.studyType,
      bucket: data.bucket,
      lab: data.lab,
      members: data.members,
      tasks: data.tasks,
      metadata: {
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
      },
    }),
  },
};

/**
 * Transform response based on API version
 */
export function transformResponse<T>(
  version: ApiVersion,
  resourceType: keyof typeof responseTransformers.v1,
  data: T
): any {
  const transformer = responseTransformers[version]?.[resourceType];
  if (!transformer) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => transformer(item));
  }

  return transformer(data);
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  response: Response,
  version: ApiVersion
): Response {
  response.headers.set('x-api-version', API_VERSIONS[version]);
  response.headers.set('x-api-latest', API_VERSIONS[LATEST_API_VERSION]);
  
  // Add deprecation warning for v1
  if (version === 'v1') {
    response.headers.set(
      'x-api-deprecation',
      'API v1 is deprecated and will be removed in future versions. Please migrate to v2.'
    );
    response.headers.set('x-api-deprecation-date', '2025-06-01');
  }
  
  return response;
}

/**
 * Version compatibility checker
 */
export function isVersionSupported(version: string): boolean {
  return version in API_VERSIONS;
}

/**
 * Get supported versions for documentation
 */
export function getSupportedVersions() {
  return Object.entries(API_VERSIONS).map(([key, value]) => ({
    version: key,
    number: value,
    isDefault: key === DEFAULT_API_VERSION,
    isLatest: key === LATEST_API_VERSION,
    isDeprecated: key === 'v1',
  }));
}