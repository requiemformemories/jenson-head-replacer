// Configuration constants and default values

// Default settings
export const DEFAULT_CONFIG = {
    expandRatio: 1.75,
    detectionFPS: 15,
    smoothingFactor: 0.3,
    maxPositionJump: 100
};

// Current configuration (mutable)
export const config = {
    expandRatio: DEFAULT_CONFIG.expandRatio,
    detectionFPS: DEFAULT_CONFIG.detectionFPS,
    smoothingFactor: DEFAULT_CONFIG.smoothingFactor,
    maxPositionJump: DEFAULT_CONFIG.maxPositionJump
};

// Reset configuration to defaults
export function resetConfig() {
    config.expandRatio = DEFAULT_CONFIG.expandRatio;
    config.detectionFPS = DEFAULT_CONFIG.detectionFPS;
    config.smoothingFactor = DEFAULT_CONFIG.smoothingFactor;
    config.maxPositionJump = DEFAULT_CONFIG.maxPositionJump;
}
