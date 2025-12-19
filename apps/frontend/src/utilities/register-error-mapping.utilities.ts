export type RegisterErrorMessageKey =
  | 'register.errors.conflict'
  | 'register.errors.forbidden'
  | 'register.errors.server'
  | 'register.errors.generic';

type AxiosErrorLike = {
  response?: {
    status?: number;
  };
};

function extractStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const axiosLike = error as AxiosErrorLike;
  const status = axiosLike.response?.status;

  return typeof status === 'number' ? status : undefined;
}

export function mapRegisterErrorToKey(error: unknown): RegisterErrorMessageKey {
  const status = extractStatus(error);

  if (status === 409) {
    return 'register.errors.conflict';
  }

  if (status === 403) {
    return 'register.errors.forbidden';
  }

  if (status && status >= 500) {
    return 'register.errors.server';
  }

  return 'register.errors.generic';
}
