export interface ConfigurationTypes {
  enableForgetPassword: boolean;
  enableRegistration: boolean;
  enableReviewPendingRegistration: boolean;
}

export const DEFAULT_NANOGPT_CONFIG: ConfigurationTypes = {
  enableForgetPassword: false,
  enableRegistration: true,
  enableReviewPendingRegistration: true,
};
