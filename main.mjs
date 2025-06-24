#!/usr/bin/env node

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
} from "fs";
import { join, dirname, resolve, isAbsolute } from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";

// =============================================
// ENHANCED TYPE SYSTEM & VALIDATION FRAMEWORK
// =============================================

/**
 * Comprehensive argument type definitions with validation strategies
 */
const ArgumentTypes = Object.freeze({
  STRING: "string",
  BOOLEAN: "boolean",
  NUMBER: "number",
  INTEGER: "integer",
  FLOAT: "float",
  ARRAY: "array",
  ENUM: "enum",
  PATH: "path",
  FILE_PATH: "file_path",
  DIR_PATH: "dir_path",
  URL: "url",
  EMAIL: "email",
  DATE: "date",
  JSON: "json",
  REGEX: "regex",
});

/**
 * Built-in validation strategies using Strategy Pattern
 */
class ValidationStrategies {
  static get STRING() {
    return {
      validate: (value) => typeof value === "string",
      message: "Value must be a string",
    };
  }

  static get BOOLEAN() {
    return {
      validate: (value) => typeof value === "boolean",
      message: "Value must be a boolean",
    };
  }

  static get NUMBER() {
    return {
      validate: (value) => typeof value === "number" && !isNaN(value),
      message: "Value must be a valid number",
    };
  }

  static get INTEGER() {
    return {
      validate: (value) => Number.isInteger(Number(value)),
      message: "Value must be an integer",
    };
  }

  static get FLOAT() {
    return {
      validate: (value) => !isNaN(parseFloat(value)) && isFinite(value),
      message: "Value must be a valid float",
    };
  }

  static get ARRAY() {
    return {
      validate: (value) => Array.isArray(value),
      message: "Value must be an array",
    };
  }

  static get PATH() {
    return {
      validate: (value) => typeof value === "string" && value.length > 0,
      message: "Value must be a valid path",
    };
  }

  static get FILE_PATH() {
    return {
      validate: (value) => {
        try {
          return (
            typeof value === "string" &&
            existsSync(value) &&
            statSync(value).isFile()
          );
        } catch {
          return false;
        }
      },
      message: "Value must be a valid existing file path",
    };
  }

  static get DIR_PATH() {
    return {
      validate: (value) => {
        try {
          return (
            typeof value === "string" &&
            existsSync(value) &&
            statSync(value).isDirectory()
          );
        } catch {
          return false;
        }
      },
      message: "Value must be a valid existing directory path",
    };
  }

  static get URL() {
    return {
      validate: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: "Value must be a valid URL",
    };
  }

  static get EMAIL() {
    return {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "Value must be a valid email address",
    };
  }

  static get DATE() {
    return {
      validate: (value) => {
        if (value instanceof Date) return !isNaN(value.getTime());
        if (typeof value === "string") return !isNaN(Date.parse(value));
        return false;
      },
      message: "Value must be a valid date",
    };
  }

  static get JSON() {
    return {
      validate: (value) => {
        try {
          JSON.parse(typeof value === "string" ? value : JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
      message: "Value must be valid JSON",
    };
  }

  static ENUM(allowedValues) {
    return {
      validate: (value) => allowedValues.includes(value),
      message: `Value must be one of: ${allowedValues.join(", ")}`,
    };
  }

  static REGEX(pattern, flags) {
    const regex = new RegExp(pattern, flags);
    return {
      validate: (value) => regex.test(String(value)),
      message: `Value must match pattern: ${pattern}`,
    };
  }

  static RANGE(min, max) {
    return {
      validate: (value) => {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      message: `Value must be between ${min} and ${max}`,
    };
  }

  static MIN_LENGTH(length) {
    return {
      validate: (value) => String(value).length >= length,
      message: `Value must be at least ${length} characters long`,
    };
  }

  static MAX_LENGTH(length) {
    return {
      validate: (value) => String(value).length <= length,
      message: `Value must be no more than ${length} characters long`,
    };
  }
}

/**
 * Chainable validation system using Chain of Responsibility Pattern
 */
class ValidationChain {
  constructor() {
    this._validators = [];
    this._transformers = [];
  }

  /**
   * Add a validation rule to the chain
   */
  addValidator(validator) {
    if (typeof validator === "function") {
      this._validators.push({
        validate: validator,
        message: "Custom validation failed",
      });
    } else if (validator && typeof validator.validate === "function") {
      this._validators.push(validator);
    } else {
      throw new ArgumentValidationError("Invalid validator provided");
    }
    return this;
  }

  /**
   * Add multiple validators at once
   */
  addValidators(validators) {
    validators.forEach((validator) => this.addValidator(validator));
    return this;
  }

  /**
   * Add a transformation function
   */
  addTransformer(transformer) {
    if (typeof transformer !== "function") {
      throw new ArgumentValidationError("Transformer must be a function");
    }
    this._transformers.push(transformer);
    return this;
  }

  /**
   * Execute validation chain
   */
  validate(value, context = {}) {
    for (const validator of this._validators) {
      const isValid = validator.validate(value, context);
      if (!isValid) {
        throw new ArgumentValidationError(
          validator.message || "Validation failed"
        );
      }
    }
    return true;
  }

  /**
   * Execute transformation chain
   */
  transform(value, context = {}) {
    return this._transformers.reduce((acc, transformer) => {
      return transformer(acc, context);
    }, value);
  }

  /**
   * Get all validators
   */
  getValidators() {
    return [...this._validators];
  }

  /**
   * Get all transformers
   */
  getTransformers() {
    return [...this._transformers];
  }
}

// =============================================
// ENHANCED ERROR HANDLING SYSTEM
// =============================================

/**
 * Base error class for argument-related errors
 */
class ArgumentError extends Error {
  constructor(message, code = "ARG_ERROR") {
    super(message);
    this.name = "ArgumentError";
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Validation-specific error
 */
class ArgumentValidationError extends ArgumentError {
  constructor(message, field = null) {
    super(message, "ARG_VALIDATION_ERROR");
    this.name = "ArgumentValidationError";
    this.field = field;
  }
}

/**
 * Transformation-specific error
 */
class ArgumentTransformationError extends ArgumentError {
  constructor(message, originalValue = null) {
    super(message, "ARG_TRANSFORMATION_ERROR");
    this.name = "ArgumentTransformationError";
    this.originalValue = originalValue;
  }
}

/**
 * Execution-specific error
 */
class ArgumentExecutionError extends ArgumentError {
  constructor(message, flag = null) {
    super(message, "ARG_EXECUTION_ERROR");
    this.name = "ArgumentExecutionError";
    this.flag = flag;
  }
}

/**
 * Configuration-specific error
 */
class ConfigurationError extends ArgumentError {
  constructor(message) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

/**
 * API-specific error
 */
class APIError extends ArgumentError {
  constructor(message, statusCode = null) {
    super(message, "API_ERROR");
    this.name = "APIError";
    this.statusCode = statusCode;
  }
}

// =============================================
// ENHANCED ARGUMENT OPTION ARCHITECTURE
// =============================================

/**
 * Enhanced ArgumentOption with proper encapsulation and extensibility
 * Implements Template Method, Strategy, and Builder patterns
 */
class ArgumentOption extends EventEmitter {
  #flags;
  #description;
  #type;
  #required;
  #defaultValue;
  #validationChain;
  #handler;
  #metadata;
  #frozen;

  constructor(config) {
    super();

    // Validate configuration
    this._validateConfig(config);

    // Initialize private fields with proper encapsulation
    this.#flags = Object.freeze([...config.flags]);
    this.#description = config.description || "";
    this.#type = config.type || ArgumentTypes.STRING;
    this.#required = Boolean(config.required);
    this.#defaultValue = config.defaultValue;
    this.#handler = config.handler;
    this.#metadata = Object.freeze({
      createdAt: new Date().toISOString(),
      version: "2.0.0",
      ...config.metadata,
    });
    this.#frozen = false;

    // Initialize validation chain
    this.#validationChain = new ValidationChain();
    this._setupValidationChain(config);

    // Setup event handling
    this._setupEventHandlers();
  }

  // ===== GETTERS (READ-ONLY ACCESS) =====
  get flags() {
    return [...this.#flags];
  }
  get description() {
    return this.#description;
  }
  get type() {
    return this.#type;
  }
  get required() {
    return this.#required;
  }
  get defaultValue() {
    return this.#defaultValue;
  }
  get metadata() {
    return { ...this.#metadata };
  }
  get isFrozen() {
    return this.#frozen;
  }

  /**
   * Primary flag (first in the flags array)
   */
  get primaryFlag() {
    return this.#flags[0];
  }

  /**
   * Check if this option matches a given flag
   */
  matchesFlag(flag) {
    return this.#flags.includes(flag);
  }

  /**
   * Template Method: Main processing pipeline
   * This defines the algorithm structure that subclasses can extend
   */
  async process(rawValue, context = {}) {
    try {
      this.emit("processing:start", { flag: this.primaryFlag, rawValue });

      // 1. Pre-processing hook
      await this._beforeProcess(rawValue, context);

      // 2. Transform the value
      const transformedValue = await this._executeTransformation(
        rawValue,
        context
      );

      // 3. Validate the transformed value
      await this._executeValidation(transformedValue, context);

      // 4. Execute the handler
      const result = await this._executeHandler(transformedValue, context);

      // 5. Post-processing hook
      await this._afterProcess(result, context);

      this.emit("processing:complete", { flag: this.primaryFlag, result });
      return result;
    } catch (error) {
      this.emit("processing:error", { flag: this.primaryFlag, error });
      throw error;
    }
  }

  /**
   * Execute validation using the validation chain
   */
  async _executeValidation(value, context) {
    try {
      // Check required constraint
      if (this.#required && (value === undefined || value === null)) {
        throw new ArgumentValidationError(
          `Argument ${this.primaryFlag} is required but was not provided`,
          this.primaryFlag
        );
      }

      // Skip validation if value is undefined and not required
      if (value === undefined && !this.#required) {
        return true;
      }

      // Execute validation chain
      return this.#validationChain.validate(value, context);
    } catch (error) {
      if (error instanceof ArgumentValidationError) {
        throw error;
      }
      throw new ArgumentValidationError(
        `Validation failed for ${this.primaryFlag}: ${error.message}`,
        this.primaryFlag
      );
    }
  }

  /**
   * Execute transformation using the validation chain
   */
  async _executeTransformation(value, context) {
    try {
      // Apply default value if needed
      if (value === undefined && this.#defaultValue !== undefined) {
        value =
          typeof this.#defaultValue === "function"
            ? await this.#defaultValue(context)
            : this.#defaultValue;
      }

      // Execute transformation chain
      return this.#validationChain.transform(value, context);
    } catch (error) {
      throw new ArgumentTransformationError(
        `Transformation failed for ${this.primaryFlag}: ${error.message}`,
        value
      );
    }
  }

  /**
   * Execute the handler function
   */
  async _executeHandler(value, context) {
    if (!this.#handler) {
      return value;
    }

    try {
      return await this.#handler(value, context, this);
    } catch (error) {
      throw new ArgumentExecutionError(
        `Handler execution failed for ${this.primaryFlag}: ${error.message}`,
        this.primaryFlag
      );
    }
  }

  // ===== TEMPLATE METHOD HOOKS =====
  async _beforeProcess(rawValue, context) {
    // Hook for subclasses to implement pre-processing logic
  }

  async _afterProcess(result, context) {
    // Hook for subclasses to implement post-processing logic
  }

  // ===== VALIDATION CHAIN MANAGEMENT =====
  addValidator(validator) {
    this._ensureNotFrozen();
    this.#validationChain.addValidator(validator);
    return this;
  }

  addTransformer(transformer) {
    this._ensureNotFrozen();
    this.#validationChain.addTransformer(transformer);
    return this;
  }

  /**
   * Freeze the option to prevent further modifications
   */
  freeze() {
    this.#frozen = true;
    return this;
  }

  /**
   * Create a builder for this option type
   */
  static builder() {
    return new ArgumentOptionBuilder();
  }

  // ===== PRIVATE METHODS =====
  _validateConfig(config) {
    if (!config || typeof config !== "object") {
      throw new ArgumentValidationError("Configuration object is required");
    }

    if (
      !config.flags ||
      !Array.isArray(config.flags) ||
      config.flags.length === 0
    ) {
      throw new ArgumentValidationError("At least one flag is required");
    }

    if (
      config.flags.some(
        (flag) => typeof flag !== "string" || !flag.startsWith("-")
      )
    ) {
      throw new ArgumentValidationError(
        'All flags must be strings starting with "-"'
      );
    }

    if (config.type && !Object.values(ArgumentTypes).includes(config.type)) {
      throw new ArgumentValidationError(
        `Invalid argument type: ${config.type}`
      );
    }
  }

  _setupValidationChain(config) {
    // Add type-based validation
    const typeValidator = this._getTypeValidator(this.#type);
    if (typeValidator) {
      this.#validationChain.addValidator(typeValidator);
    }

    // Add custom validators
    if (config.validators) {
      if (Array.isArray(config.validators)) {
        this.#validationChain.addValidators(config.validators);
      } else {
        this.#validationChain.addValidator(config.validators);
      }
    }

    // Add legacy validator for backward compatibility
    if (config.validator) {
      this.#validationChain.addValidator({
        validate: config.validator,
        message: "Legacy validation failed",
      });
    }

    // Add transformers
    if (config.transformers) {
      if (Array.isArray(config.transformers)) {
        config.transformers.forEach((t) =>
          this.#validationChain.addTransformer(t)
        );
      } else {
        this.#validationChain.addTransformer(config.transformers);
      }
    }

    // Add legacy transformer for backward compatibility
    if (config.transformer) {
      this.#validationChain.addTransformer(config.transformer);
    }
  }

  _getTypeValidator(type) {
    const validators = {
      [ArgumentTypes.STRING]: ValidationStrategies.STRING,
      [ArgumentTypes.BOOLEAN]: ValidationStrategies.BOOLEAN,
      [ArgumentTypes.NUMBER]: ValidationStrategies.NUMBER,
      [ArgumentTypes.INTEGER]: ValidationStrategies.INTEGER,
      [ArgumentTypes.FLOAT]: ValidationStrategies.FLOAT,
      [ArgumentTypes.ARRAY]: ValidationStrategies.ARRAY,
      [ArgumentTypes.PATH]: ValidationStrategies.PATH,
      [ArgumentTypes.FILE_PATH]: ValidationStrategies.FILE_PATH,
      [ArgumentTypes.DIR_PATH]: ValidationStrategies.DIR_PATH,
      [ArgumentTypes.URL]: ValidationStrategies.URL,
      [ArgumentTypes.EMAIL]: ValidationStrategies.EMAIL,
      [ArgumentTypes.DATE]: ValidationStrategies.DATE,
      [ArgumentTypes.JSON]: ValidationStrategies.JSON,
    };

    return validators[type];
  }

  _setupEventHandlers() {
    // Setup default event handlers
    this.on("processing:error", (data) => {
      console.error(`❌ Error processing ${data.flag}: ${data.error.message}`);
    });
  }

  _ensureNotFrozen() {
    if (this.#frozen) {
      throw new ArgumentValidationError("Cannot modify frozen ArgumentOption");
    }
  }
}

/**
 * Builder Pattern implementation for ArgumentOption
 * Provides fluent interface for complex option configuration
 */
class ArgumentOptionBuilder {
  constructor() {
    this._config = {
      flags: [],
      validators: [],
      transformers: [],
      metadata: {},
    };
  }

  /**
   * Set flags for the option
   */
  flags(...flags) {
    this._config.flags = flags.flat();
    return this;
  }

  /**
   * Set description
   */
  description(desc) {
    this._config.description = desc;
    return this;
  }

  /**
   * Set type
   */
  type(type) {
    this._config.type = type;
    return this;
  }

  /**
   * Mark as required
   */
  required(isRequired = true) {
    this._config.required = isRequired;
    return this;
  }

  /**
   * Set default value
   */
  defaultValue(value) {
    this._config.defaultValue = value;
    return this;
  }

  /**
   * Add validator
   */
  validator(validator) {
    this._config.validators.push(validator);
    return this;
  }

  /**
   * Add transformer
   */
  transformer(transformer) {
    this._config.transformers.push(transformer);
    return this;
  }

  /**
   * Set handler
   */
  handler(handler) {
    this._config.handler = handler;
    return this;
  }

  /**
   * Add metadata
   */
  metadata(key, value) {
    if (typeof key === "object") {
      Object.assign(this._config.metadata, key);
    } else {
      this._config.metadata[key] = value;
    }
    return this;
  }

  /**
   * Build the ArgumentOption
   */
  build() {
    return new ArgumentOption(this._config);
  }

  /**
   * Build and freeze the ArgumentOption
   */
  buildAndFreeze() {
    return this.build().freeze();
  }
}

// =============================================
// SPECIALIZED ARGUMENT OPTION CLASSES
// =============================================

/**
 * Specialized String Argument Option
 */
class StringArgumentOption extends ArgumentOption {
  constructor(config) {
    super({
      ...config,
      type: ArgumentTypes.STRING,
    });
  }

  /**
   * Add string-specific validators
   */
  minLength(length) {
    return this.addValidator(ValidationStrategies.MIN_LENGTH(length));
  }

  maxLength(length) {
    return this.addValidator(ValidationStrategies.MAX_LENGTH(length));
  }

  pattern(regex, flags) {
    return this.addValidator(ValidationStrategies.REGEX(regex, flags));
  }

  static builder() {
    return new StringArgumentOptionBuilder();
  }
}

/**
 * Builder for StringArgumentOption
 */
class StringArgumentOptionBuilder extends ArgumentOptionBuilder {
  minLength(length) {
    return this.validator(ValidationStrategies.MIN_LENGTH(length));
  }

  maxLength(length) {
    return this.validator(ValidationStrategies.MAX_LENGTH(length));
  }

  pattern(regex, flags) {
    return this.validator(ValidationStrategies.REGEX(regex, flags));
  }

  build() {
    return new StringArgumentOption(this._config);
  }
}

/**
 * Specialized Number Argument Option
 */
class NumberArgumentOption extends ArgumentOption {
  constructor(config) {
    super({
      ...config,
      type: ArgumentTypes.NUMBER,
    });
  }

  range(min, max) {
    return this.addValidator(ValidationStrategies.RANGE(min, max));
  }

  static builder() {
    return new NumberArgumentOptionBuilder();
  }
}

/**
 * Builder for NumberArgumentOption
 */
class NumberArgumentOptionBuilder extends ArgumentOptionBuilder {
  range(min, max) {
    return this.validator(ValidationStrategies.RANGE(min, max));
  }

  build() {
    return new NumberArgumentOption(this._config);
  }
}

/**
 * Specialized Boolean Argument Option
 */
class BooleanArgumentOption extends ArgumentOption {
  constructor(config) {
    super({
      ...config,
      type: ArgumentTypes.BOOLEAN,
    });
  }

  static builder() {
    return new BooleanArgumentOptionBuilder();
  }
}

/**
 * Builder for BooleanArgumentOption
 */
class BooleanArgumentOptionBuilder extends ArgumentOptionBuilder {
  build() {
    return new BooleanArgumentOption(this._config);
  }
}

/**
 * Specialized Enum Argument Option
 */
class EnumArgumentOption extends ArgumentOption {
  #allowedValues;

  constructor(config) {
    if (!config.allowedValues || !Array.isArray(config.allowedValues)) {
      throw new ArgumentValidationError(
        "EnumArgumentOption requires allowedValues array"
      );
    }

    super({
      ...config,
      type: ArgumentTypes.ENUM,
      validators: [
        ...(config.validators || []),
        ValidationStrategies.ENUM(config.allowedValues),
      ],
    });

    this.#allowedValues = Object.freeze([...config.allowedValues]);
  }

  get allowedValues() {
    return [...this.#allowedValues];
  }

  static builder() {
    return new EnumArgumentOptionBuilder();
  }
}

/**
 * Builder for EnumArgumentOption
 */
class EnumArgumentOptionBuilder extends ArgumentOptionBuilder {
  allowedValues(...values) {
    this._config.allowedValues = values.flat();
    return this;
  }

  build() {
    return new EnumArgumentOption(this._config);
  }
}

/**
 * Factory for creating specialized ArgumentOption instances
 */
class ArgumentOptionFactory {
  static string(config) {
    return new StringArgumentOption(config);
  }

  static number(config) {
    return new NumberArgumentOption(config);
  }

  static boolean(config) {
    return new BooleanArgumentOption(config);
  }

  static enum(config) {
    return new EnumArgumentOption(config);
  }

  static create(type, config) {
    const factories = {
      [ArgumentTypes.STRING]: () => this.string(config),
      [ArgumentTypes.NUMBER]: () => this.number(config),
      [ArgumentTypes.INTEGER]: () =>
        this.number({ ...config, type: ArgumentTypes.INTEGER }),
      [ArgumentTypes.FLOAT]: () =>
        this.number({ ...config, type: ArgumentTypes.FLOAT }),
      [ArgumentTypes.BOOLEAN]: () => this.boolean(config),
      [ArgumentTypes.ENUM]: () => this.enum(config),
    };

    const factory = factories[type];
    if (!factory) {
      return new ArgumentOption({ ...config, type });
    }

    return factory();
  }
}

// =============================================
// ENHANCED REGISTRY WITH OBSERVER PATTERN
// =============================================

/**
 * Enhanced ArgumentRegistry with event support and better organization
 */
class ArgumentRegistry extends EventEmitter {
  #options;
  #flagToOption;
  #categories;
  #frozen;

  constructor() {
    super();
    this.#options = new Map();
    this.#flagToOption = new Map();
    this.#categories = new Map();
    this.#frozen = false;
    this._registerCoreOptions();
  }

  /**
   * Register a new argument option with category support
   */
  register(option, category = "general") {
    this._ensureNotFrozen();

    if (!(option instanceof ArgumentOption)) {
      throw new ArgumentValidationError(
        "Option must be an instance of ArgumentOption"
      );
    }

    const key = option.primaryFlag;

    // Check for flag conflicts
    for (const flag of option.flags) {
      if (this.#flagToOption.has(flag)) {
        throw new ArgumentValidationError(`Flag ${flag} is already registered`);
      }
    }

    // Register the option
    this.#options.set(key, option);

    // Map all flags to this option
    option.flags.forEach((flag) => {
      this.#flagToOption.set(flag, option);
    });

    // Add to category
    if (!this.#categories.has(category)) {
      this.#categories.set(category, new Set());
    }
    this.#categories.get(category).add(option);

    this.emit("option:registered", { option, category });
    return this;
  }

  /**
   * Register multiple options with batch processing
   */
  registerBatch(options, category = "general") {
    this._ensureNotFrozen();

    const results = [];
    for (const option of options) {
      try {
        this.register(option, category);
        results.push({ option, success: true });
      } catch (error) {
        results.push({ option, success: false, error });
      }
    }

    this.emit("batch:registered", { results, category });
    return this;
  }

  /**
   * Get option by flag
   */
  getByFlag(flag) {
    return this.#flagToOption.get(flag);
  }

  /**
   * Get all registered options
   */
  getAll() {
    return Array.from(this.#options.values());
  }

  /**
   * Get options by category
   */
  getByCategory(category) {
    const categorySet = this.#categories.get(category);
    return categorySet ? Array.from(categorySet) : [];
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.#categories.keys());
  }

  /**
   * Check if flag exists
   */
  hasFlag(flag) {
    return this.#flagToOption.has(flag);
  }

  /**
   * Remove option by flag
   */
  unregister(flag) {
    this._ensureNotFrozen();

    const option = this.#flagToOption.get(flag);
    if (!option) {
      return false;
    }

    // Remove from main registry
    this.#options.delete(option.primaryFlag);

    // Remove all flag mappings
    option.flags.forEach((f) => {
      this.#flagToOption.delete(f);
    });

    // Remove from categories
    for (const [category, options] of this.#categories.entries()) {
      options.delete(option);
      if (options.size === 0) {
        this.#categories.delete(category);
      }
    }

    this.emit("option:unregistered", { option });
    return true;
  }

  /**
   * Clear all options
   */
  clear() {
    this._ensureNotFrozen();

    this.#options.clear();
    this.#flagToOption.clear();
    this.#categories.clear();

    this.emit("registry:cleared");
    return this;
  }

  /**
   * Freeze the registry to prevent modifications
   */
  freeze() {
    this.#frozen = true;
    this.emit("registry:frozen");
    return this;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalOptions: this.#options.size,
      totalFlags: this.#flagToOption.size,
      totalCategories: this.#categories.size,
      isFrozen: this.#frozen,
      categoriesBreakdown: Object.fromEntries(
        Array.from(this.#categories.entries()).map(([category, options]) => [
          category,
          options.size,
        ])
      ),
    };
  }

  // ===== PRIVATE METHODS =====
  _ensureNotFrozen() {
    if (this.#frozen) {
      throw new ArgumentValidationError(
        "Cannot modify frozen ArgumentRegistry"
      );
    }
  }

  /**
   * Register core/default options using the enhanced system
   */
  _registerCoreOptions() {
    const coreOptions = [
      // Repository analysis option
      StringArgumentOption.builder()
        .flags("-r", "--repo")
        .description("Repository to analyze (owner/repo format)")
        .validator((value) => typeof value === "string" && value.includes("/"))
        .handler(async (value, context) => {
          context.setAnalysisMode("repository");
          context.setTarget(value);
        })
        .metadata("category", "analysis")
        .buildAndFreeze(),

      // User analysis option
      StringArgumentOption.builder()
        .flags("-u", "--user")
        .description("Username to analyze")
        .handler(async (value, context) => {
          context.setAnalysisMode("user");
          context.setTarget(value);
        })
        .metadata("category", "analysis")
        .buildAndFreeze(),

      // Output format option
      EnumArgumentOption.builder()
        .flags("-f", "--format")
        .description("Output format: json, csv, or both")
        .allowedValues("json", "csv", "both")
        .defaultValue("json")
        .handler(async (value, context) => {
          context.setOutputFormat(value);
        })
        .metadata("category", "output")
        .buildAndFreeze(),

      // Output directory option
      StringArgumentOption.builder()
        .flags("-o", "--output")
        .description("Output directory")
        .defaultValue("./reports")
        .handler(async (value, context) => {
          context.setOutputDirectory(value);
        })
        .metadata("category", "output")
        .buildAndFreeze(),

      // Verbose logging option
      BooleanArgumentOption.builder()
        .flags("-v", "--verbose")
        .description("Enable verbose logging")
        .handler(async (value, context) => {
          context.setVerbose(value);
        })
        .metadata("category", "logging")
        .buildAndFreeze(),

      // Debug logging option
      BooleanArgumentOption.builder()
        .flags("-d", "--debug")
        .description("Enable debug logging")
        .handler(async (value, context) => {
          context.setDebug(value);
          context.setVerbose(true); // Debug implies verbose
        })
        .metadata("category", "logging")
        .buildAndFreeze(),

      // Help option
      BooleanArgumentOption.builder()
        .flags("-h", "--help")
        .description("Show help message")
        .handler(async (value, context) => {
          context.showHelp();
        })
        .metadata("category", "utility")
        .buildAndFreeze(),

      // Start date option
      StringArgumentOption.builder()
        .flags("-s", "--start")
        .description("Start date (YYYY-MM-DD format)")
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .transformer((value) => new Date(value).toISOString().split("T")[0])
        .handler(async (value, context) => {
          context.setStartDate(value);
        })
        .metadata("category", "filters")
        .buildAndFreeze(),

      // End date option
      StringArgumentOption.builder()
        .flags("-e", "--end")
        .description("End date (YYYY-MM-DD format)")
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .transformer((value) => new Date(value).toISOString().split("T")[0])
        .handler(async (value, context) => {
          context.setEndDate(value);
        })
        .metadata("category", "filters")
        .buildAndFreeze(),

      // GitHub token option
      StringArgumentOption.builder()
        .flags("-t", "--token")
        .description("GitHub API token")
        .minLength(10)
        .handler(async (value, context) => {
          context.setToken(value);
        })
        .metadata("category", "authentication")
        .buildAndFreeze(),

      // Fetch limit option
      StringArgumentOption.builder()
        .flags("-l", "--fetchLimit")
        .description('Fetch limit (number or "infinite")')
        .defaultValue("50")
        .transformer((value) => {
          if (value === "infinite" || value === "-1") {
            return Number.MAX_SAFE_INTEGER;
          }
          return parseInt(value) || 50;
        })
        .handler(async (value, context) => {
          context.setFetchLimit(value);
        })
        .metadata("category", "performance")
        .buildAndFreeze(),
    ];

    // Register options by category
    const categoryMap = {
      analysis: [],
      output: [],
      logging: [],
      utility: [],
      filters: [],
      authentication: [],
      performance: [],
    };

    coreOptions.forEach((option) => {
      const category = option.metadata.category || "general";
      if (categoryMap[category]) {
        categoryMap[category].push(option);
      } else {
        this.register(option, "general");
      }
    });

    // Register by categories
    Object.entries(categoryMap).forEach(([category, options]) => {
      if (options.length > 0) {
        this.registerBatch(options, category);
      }
    });
  }
}

// =============================================
// ENHANCED PARSE CONTEXT WITH STATE MANAGEMENT
// =============================================

/**
 * Enhanced ParseContext with better state management and immutability
 */
class ParseContext extends EventEmitter {
  #config;
  #shouldShowHelp;
  #analysisMode;
  #executionQueue;
  #state;
  #frozen;

  constructor() {
    super();
    this.#config = {};
    this.#shouldShowHelp = false;
    this.#analysisMode = "auto";
    this.#executionQueue = [];
    this.#state = new Map();
    this.#frozen = false;
  }

  // ===== CONFIGURATION SETTERS =====
  setTarget(value) {
    this._ensureNotFrozen();
    this.#config.target = value;
    this.emit("config:changed", { key: "target", value });
  }

  setAnalysisMode(mode) {
    this._ensureNotFrozen();
    this.#analysisMode = mode;
    this.emit("mode:changed", { mode });
  }

  setOutputFormat(format) {
    this._ensureNotFrozen();
    this.#config.format = format;
    this.emit("config:changed", { key: "format", value: format });
  }

  setOutputDirectory(dir) {
    this._ensureNotFrozen();
    this.#config.output = dir;
    this.emit("config:changed", { key: "output", value: dir });
  }

  setVerbose(value) {
    this._ensureNotFrozen();
    this.#config.verbose = value;
    this.emit("config:changed", { key: "verbose", value });
  }

  setDebug(value) {
    this._ensureNotFrozen();
    this.#config.debug = value;
    this.emit("config:changed", { key: "debug", value });
  }

  setStartDate(date) {
    this._ensureNotFrozen();
    this.#config.startDate = date;
    this.emit("config:changed", { key: "startDate", value: date });
  }

  setEndDate(date) {
    this._ensureNotFrozen();
    this.#config.endDate = date;
    this.emit("config:changed", { key: "endDate", value: date });
  }

  setToken(token) {
    this._ensureNotFrozen();
    this.#config.token = token;
    this.emit("config:changed", { key: "token", value: "***masked***" });
  }

  setFetchLimit(limit) {
    this._ensureNotFrozen();
    this.#config.fetchLimit = limit;
    this.emit("config:changed", { key: "fetchLimit", value: limit });
  }

  // ===== HELP SYSTEM =====
  showHelp() {
    this.#shouldShowHelp = true;
    this.emit("help:requested");
  }

  get shouldShowHelp() {
    return this.#shouldShowHelp;
  }

  get analysisMode() {
    return this.#analysisMode;
  }

  // ===== EXECUTION QUEUE MANAGEMENT =====
  queueExecution(fn, priority = 0) {
    this._ensureNotFrozen();
    this.#executionQueue.push({ fn, priority, id: Math.random().toString(36) });
    this.#executionQueue.sort((a, b) => b.priority - a.priority);
    this.emit("execution:queued", { priority });
  }

  async executeAll() {
    this.emit("execution:start", { queueSize: this.#executionQueue.length });

    const results = [];
    for (const { fn, id } of this.#executionQueue) {
      try {
        const result = await fn();
        results.push({ id, success: true, result });
        this.emit("execution:item:success", { id, result });
      } catch (error) {
        results.push({ id, success: false, error });
        this.emit("execution:item:error", { id, error });
      }
    }

    this.emit("execution:complete", { results });
    return results;
  }

  clearQueue() {
    this._ensureNotFrozen();
    this.#executionQueue.length = 0;
    this.emit("execution:cleared");
  }

  // ===== STATE MANAGEMENT =====
  setState(key, value) {
    this._ensureNotFrozen();
    this.#state.set(key, value);
    this.emit("state:changed", { key, value });
  }

  getState(key) {
    return this.#state.get(key);
  }

  hasState(key) {
    return this.#state.has(key);
  }

  deleteState(key) {
    this._ensureNotFrozen();
    const deleted = this.#state.delete(key);
    if (deleted) {
      this.emit("state:deleted", { key });
    }
    return deleted;
  }

  // ===== CONFIGURATION ACCESS =====
  getConfiguration() {
    return Object.freeze({ ...this.#config });
  }

  getFullState() {
    return {
      config: this.getConfiguration(),
      shouldShowHelp: this.#shouldShowHelp,
      analysisMode: this.#analysisMode,
      queueSize: this.#executionQueue.length,
      stateKeys: Array.from(this.#state.keys()),
      isFrozen: this.#frozen,
    };
  }

  // ===== IMMUTABILITY =====
  freeze() {
    this.#frozen = true;
    this.emit("context:frozen");
    return this;
  }

  get isFrozen() {
    return this.#frozen;
  }

  // ===== PRIVATE METHODS =====
  _ensureNotFrozen() {
    if (this.#frozen) {
      throw new ConfigurationError("Cannot modify frozen ParseContext");
    }
  }
}

// =============================================
// ENHANCED EXTENSIBLE ARGUMENT PARSER
// =============================================

/**
 * Enhanced ExtensibleArgumentParser with better error handling and extensibility
 */
class ExtensibleArgumentParser extends EventEmitter {
  #registry;
  #options;
  #frozen;

  constructor(registry = null) {
    super();
    this.#registry = registry || new ArgumentRegistry();
    this.#options = {
      strictMode: false,
      allowUnknownFlags: false,
      caseSensitive: true,
      stopAtFirstPositional: false,
    };
    this.#frozen = false;

    // Setup event forwarding from registry
    this.#registry.on("option:registered", (data) => {
      this.emit("option:registered", data);
    });
  }

  // ===== PARSER CONFIGURATION =====
  setOptions(options) {
    this._ensureNotFrozen();
    Object.assign(this.#options, options);
    this.emit("options:changed", options);
    return this;
  }

  enableStrictMode() {
    return this.setOptions({ strictMode: true });
  }

  allowUnknownFlags() {
    return this.setOptions({ allowUnknownFlags: true });
  }

  // ===== OPTION MANAGEMENT =====
  addOption(optionConfig) {
    this._ensureNotFrozen();
    const option =
      optionConfig instanceof ArgumentOption
        ? optionConfig
        : ArgumentOptionFactory.create(
            optionConfig.type || ArgumentTypes.STRING,
            optionConfig
          );

    this.#registry.register(option);
    this.emit("option:added", { option });
    return this;
  }

  addOptions(optionConfigs) {
    this._ensureNotFrozen();
    optionConfigs.forEach((config) => this.addOption(config));
    return this;
  }

  // ===== PARSING LOGIC =====
  async parse(args = process.argv.slice(2)) {
    this.emit("parsing:start", { args });

    const context = new ParseContext();
    const parseState = {
      index: 0,
      positionalArgs: [],
      errors: [],
      warnings: [],
    };

    try {
      while (parseState.index < args.length) {
        const arg = args[parseState.index];

        if (this._isFlag(arg)) {
          parseState.index = await this._processFlag(
            args,
            parseState.index,
            context,
            parseState
          );
        } else {
          this._processPositionalArgument(arg, context, parseState);
        }

        parseState.index++;
      }

      // Execute all queued operations
      await context.executeAll();

      const result = {
        config: context.getConfiguration(),
        shouldShowHelp: context.shouldShowHelp,
        analysisMode: context.analysisMode,
        positionalArgs: parseState.positionalArgs,
        errors: parseState.errors,
        warnings: parseState.warnings,
        success: parseState.errors.length === 0,
      };

      this.emit("parsing:complete", result);
      return result;
    } catch (error) {
      this.emit("parsing:error", { error, parseState });
      throw error;
    }
  }

  // ===== FLAG PROCESSING =====
  async _processFlag(args, index, context, parseState) {
    const flag = args[index];
    const option = this.#registry.getByFlag(flag);

    if (!option) {
      return this._handleUnknownFlag(flag, parseState);
    }

    try {
      let value;
      let nextIndex = index;

      // Determine value based on option type
      if (option.type === ArgumentTypes.BOOLEAN) {
        value = true;
      } else {
        if (index + 1 >= args.length) {
          throw new ArgumentValidationError(`Missing value for ${flag}`);
        }
        value = args[index + 1];
        nextIndex = index + 1;
      }

      // Process the option
      await option.process(value, context);
      return nextIndex;
    } catch (error) {
      parseState.errors.push({
        flag,
        error: error.message,
        type: error.constructor.name,
      });

      if (this.#options.strictMode) {
        throw error;
      }

      parseState.warnings.push(`Failed to process ${flag}: ${error.message}`);
      return index;
    }
  }

  _handleUnknownFlag(flag, parseState) {
    const error = `Unknown argument: ${flag}`;

    if (this.#options.allowUnknownFlags) {
      parseState.warnings.push(error);
      return parseState.index;
    }

    if (this.#options.strictMode) {
      throw new ArgumentValidationError(error);
    }

    parseState.errors.push({
      flag,
      error,
      type: "UnknownFlag",
    });

    return parseState.index;
  }

  // ===== POSITIONAL ARGUMENT PROCESSING =====
  _processPositionalArgument(arg, context, parseState) {
    parseState.positionalArgs.push(arg);

    // Auto-detection logic
    if (!context.getConfiguration().target) {
      context.setTarget(arg);

      // Auto-detect analysis mode
      if (arg.includes("/")) {
        context.setAnalysisMode("repository");
      } else {
        context.setAnalysisMode("user");
      }
    }
  }

  // ===== HELP GENERATION =====
  generateHelp() {
    const categories = this.#registry.getCategories();
    const stats = this.#registry.getStats();

    let helpText = `
🔍 **Enhanced GitHub Analysis Toolkit**

USAGE:
    node main.mjs [TARGET] [OPTIONS]

SUMMARY:
    ${stats.totalOptions} options available across ${stats.totalCategories} categories
    ${stats.totalFlags} total flags registered

`;

    // Generate help by category
    categories.forEach((category) => {
      const options = this.#registry.getByCategory(category);
      if (options.length === 0) return;

      helpText += `\n📁 **${category.toUpperCase()} OPTIONS:**\n`;

      options.forEach((option) => {
        const flags = option.flags.join(", ");
        const description = option.description;
        const required = option.required ? " (required)" : "";
        const defaultVal =
          option.defaultValue !== undefined
            ? ` (default: ${option.defaultValue})`
            : "";
        const type =
          option.type !== ArgumentTypes.STRING ? ` [${option.type}]` : "";

        helpText += `    ${flags.padEnd(
          25
        )} ${description}${type}${required}${defaultVal}\n`;
      });
    });

    helpText += `
📋 **EXAMPLES:**
    # Analyze repository with verbose output
    node main.mjs facebook/react --format both --verbose
    
    # Analyze user's repositories with date range
    node main.mjs --user octocat --start 2024-01-01 --end 2024-12-31
    
    # Custom analysis with extended options
    node main.mjs microsoft/vscode --format csv --fetchLimit infinite --debug
    
    # Show detailed help
    node main.mjs --help

📊 **REGISTRY STATS:**
${Object.entries(stats.categoriesBreakdown)
  .map(([cat, count]) => `    ${cat}: ${count} options`)
  .join("\n")}

🔧 **PARSER OPTIONS:**
    Strict Mode: ${this.#options.strictMode ? "Enabled" : "Disabled"}
    Unknown Flags: ${this.#options.allowUnknownFlags ? "Allowed" : "Rejected"}
    Case Sensitive: ${this.#options.caseSensitive ? "Yes" : "No"}
`;

    return helpText;
  }

  // ===== UTILITY METHODS =====
  _isFlag(arg) {
    return typeof arg === "string" && arg.startsWith("-");
  }

  freeze() {
    this.#frozen = true;
    this.#registry.freeze();
    this.emit("parser:frozen");
    return this;
  }

  get registry() {
    return this.#registry;
  }

  get isFrozen() {
    return this.#frozen;
  }

  // ===== PRIVATE METHODS =====
  _ensureNotFrozen() {
    if (this.#frozen) {
      throw new ConfigurationError(
        "Cannot modify frozen ExtensibleArgumentParser"
      );
    }
  }
}

// =============================================
// ENHANCED CONFIGURATION SYSTEM
// =============================================

/**
 * Enhanced Configuration with validation, immutability, and environment integration
 */
class Configuration {
  #data;
  #metadata;
  #frozen;

  constructor(options = {}) {
    this.#metadata = {
      createdAt: new Date().toISOString(),
      version: "2.0.0",
      source: "programmatic",
    };

    this.#data = this._buildConfiguration(options);
    this.#frozen = false;
  }

  // ===== GETTERS =====
  get(key) {
    return this.#data[key];
  }

  getAll() {
    return { ...this.#data };
  }

  getMetadata() {
    return { ...this.#metadata };
  }

  has(key) {
    return key in this.#data;
  }

  get isFrozen() {
    return this.#frozen;
  }

  // ===== CONFIGURATION BUILDING =====
  _buildConfiguration(options) {
    const config = {
      // Core configuration
      target: options.target || null,
      format: options.format || "json",
      output: options.output || "./reports",

      // Date range with intelligent defaults
      startDate: options.startDate || this._getDefaultStartDate(),
      endDate: options.endDate || this._getDefaultEndDate(),

      // API configuration with environment fallback
      token: options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      fetchLimit: options.fetchLimit || 50,

      // Behavior flags
      verbose: Boolean(options.verbose),
      debug: Boolean(options.debug),

      // Performance settings
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      concurrency: options.concurrency || 5,

      // Extended properties
      ...this._filterValidOptions(options),
    };

    return Object.freeze(config);
  }

  _filterValidOptions(options) {
    const knownKeys = new Set([
      "target",
      "format",
      "output",
      "startDate",
      "endDate",
      "token",
      "fetchLimit",
      "verbose",
      "debug",
      "timeout",
      "retryAttempts",
      "concurrency",
    ]);

    const filtered = {};
    Object.keys(options).forEach((key) => {
      if (!knownKeys.has(key)) {
        filtered[key] = options[key];
      }
    });

    return filtered;
  }

  _getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }

  _getDefaultEndDate() {
    return new Date().toISOString().split("T")[0];
  }

  // ===== VALIDATION =====
  validate() {
    const errors = [];

    // Required field validation
    if (!this.#data.target) {
      errors.push("Target (repository or username) is required");
    }

    if (!this.#data.token) {
      errors.push(
        "GitHub token is required (set GITHUB_TOKEN environment variable or use --token)"
      );
    }

    // Format validation
    const validFormats = ["json", "csv", "both"];
    if (!validFormats.includes(this.#data.format)) {
      errors.push(`Invalid format. Must be one of: ${validFormats.join(", ")}`);
    }

    // Date validation
    if (this.#data.startDate && this.#data.endDate) {
      const start = new Date(this.#data.startDate);
      const end = new Date(this.#data.endDate);

      if (start > end) {
        errors.push("Start date must be before end date");
      }
    }

    // Numeric validations
    if (
      this.#data.fetchLimit < 1 &&
      this.#data.fetchLimit !== Number.MAX_SAFE_INTEGER
    ) {
      errors.push('Fetch limit must be a positive number or "infinite"');
    }

    if (this.#data.timeout < 1000) {
      errors.push("Timeout must be at least 1000ms");
    }

    if (errors.length > 0) {
      throw new ConfigurationError(errors.join("\n"));
    }

    return this;
  }

  // ===== IMMUTABILITY =====
  freeze() {
    this.#frozen = true;
    return this;
  }

  // ===== SERIALIZATION =====
  toJSON() {
    return {
      data: this.#data,
      metadata: this.#metadata,
      isFrozen: this.#frozen,
    };
  }

  static fromJSON(json) {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    const config = new Configuration(parsed.data);
    if (parsed.isFrozen) {
      config.freeze();
    }
    return config;
  }
}

/**
 * Enhanced ConfigurationBuilder with fluent interface and validation
 */
class ConfigurationBuilder {
  #options;
  #validators;

  constructor() {
    this.reset();
  }

  reset() {
    this.#options = {};
    this.#validators = [];
    return this;
  }

  // ===== FLUENT INTERFACE =====
  fromParsedConfig(config) {
    this.#options = { ...config };
    return this;
  }

  fromEnvironment() {
    const envConfig = {
      token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      verbose: process.env.VERBOSE === "true",
      debug: process.env.DEBUG === "true",
      output: process.env.OUTPUT_DIR,
      format: process.env.OUTPUT_FORMAT,
    };

    // Only include defined values
    Object.keys(envConfig).forEach((key) => {
      if (envConfig[key] !== undefined) {
        this.#options[key] = envConfig[key];
      }
    });

    return this;
  }

  withDefaults() {
    const defaults = {
      format: "json",
      output: "./reports",
      fetchLimit: 50,
      timeout: 30000,
      retryAttempts: 3,
      concurrency: 5,
    };

    Object.keys(defaults).forEach((key) => {
      if (this.#options[key] === undefined) {
        this.#options[key] = defaults[key];
      }
    });

    // Smart date defaults
    if (!this.#options.startDate) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      this.#options.startDate = date.toISOString().split("T")[0];
    }

    if (!this.#options.endDate) {
      this.#options.endDate = new Date().toISOString().split("T")[0];
    }

    return this;
  }

  target(target) {
    this.#options.target = target;
    return this;
  }

  format(format) {
    this.#options.format = format;
    return this;
  }

  output(output) {
    this.#options.output = output;
    return this;
  }

  token(token) {
    this.#options.token = token;
    return this;
  }

  dateRange(start, end) {
    this.#options.startDate = start;
    this.#options.endDate = end;
    return this;
  }

  verbose(enabled = true) {
    this.#options.verbose = enabled;
    return this;
  }

  debug(enabled = true) {
    this.#options.debug = enabled;
    return this;
  }

  // ===== VALIDATION =====
  addValidator(validator) {
    this.#validators.push(validator);
    return this;
  }

  validate() {
    const tempConfig = new Configuration(this.#options);
    tempConfig.validate();

    // Run custom validators
    this.#validators.forEach((validator) => {
      const result = validator(this.#options);
      if (result !== true && typeof result === "string") {
        throw new ConfigurationError(result);
      }
    });

    return this;
  }

  // ===== BUILD =====
  build() {
    return new Configuration(this.#options);
  }

  buildAndFreeze() {
    return this.build().freeze();
  }

  buildAndValidate() {
    return this.validate().build();
  }
}

// =============================================
// ENHANCED COMMAND SYSTEM
// =============================================

/**
 * Enhanced Abstract Command with lifecycle hooks and metadata
 */
class AbstractCommand extends EventEmitter {
  #config;
  #metadata;
  #state;

  constructor(config) {
    super();
    this.#config = config;
    this.#metadata = {
      createdAt: new Date().toISOString(),
      commandType: this.constructor.name,
    };
    this.#state = new Map();
  }

  // ===== GETTERS =====
  get config() {
    return this.#config;
  }

  get metadata() {
    return { ...this.#metadata };
  }

  // ===== TEMPLATE METHOD =====
  async execute() {
    try {
      this.emit("command:start", this.metadata);

      await this._beforeExecute();
      const result = await this._executeImplementation();
      await this._afterExecute(result);

      this.emit("command:complete", { result, metadata: this.metadata });
      return result;
    } catch (error) {
      this.emit("command:error", { error, metadata: this.metadata });
      await this._onError(error);
      throw error;
    }
  }

  // ===== HOOKS FOR SUBCLASSES =====
  async _beforeExecute() {
    // Override in subclasses
  }

  async _executeImplementation() {
    throw new Error(
      "_executeImplementation() must be implemented by subclasses"
    );
  }

  async _afterExecute(result) {
    // Override in subclasses
  }

  async _onError(error) {
    // Override in subclasses for error handling
  }

  // ===== STATE MANAGEMENT =====
  setState(key, value) {
    this.#state.set(key, value);
    this.emit("state:changed", { key, value });
  }

  getState(key) {
    return this.#state.get(key);
  }

  hasState(key) {
    return this.#state.has(key);
  }
}

/**
 * Enhanced Help Command with rich formatting
 */
class HelpCommand extends AbstractCommand {
  #helpText;
  #parser;

  constructor(config, helpText, parser = null) {
    super(config);
    this.#helpText = helpText;
    this.#parser = parser;
  }

  async _executeImplementation() {
    if (this.#parser) {
      console.log(this.#parser.generateHelp());
    } else {
      console.log(this.#helpText);
    }

    // Additional help information
    console.log("\n🔧 **System Information:**");
    console.log(`    Node.js Version: ${process.version}`);
    console.log(`    Platform: ${process.platform}`);
    console.log(`    Architecture: ${process.arch}`);
    console.log(`    Working Directory: ${process.cwd()}`);

    if (this.#parser && !this.#parser.isFrozen) {
      const stats = this.#parser.registry.getStats();
      console.log("\n📊 **Parser Statistics:**");
      console.log(`    Total Options: ${stats.totalOptions}`);
      console.log(`    Total Flags: ${stats.totalFlags}`);
      console.log(`    Categories: ${stats.totalCategories}`);
      console.log(
        `    Registry Status: ${stats.isFrozen ? "Frozen" : "Active"}`
      );
    }
  }
}

/**
 * Enhanced Analysis Command with progress tracking and rich output
 */
class AnalysisCommand extends AbstractCommand {
  #progressCallback;

  constructor(config, progressCallback = null) {
    super(config);
    this.#progressCallback = progressCallback;
  }

  async _beforeExecute() {
    console.log("\n🚀 **Starting Enhanced GitHub Analysis**");
    console.log("=".repeat(50));

    const config = this.config.getAll();
    console.log(`📅 Date Range: ${config.startDate} → ${config.endDate}`);
    console.log(`🎯 Target: ${config.target}`);
    console.log(`📊 Fetch Limit: ${this._formatFetchLimit(config.fetchLimit)}`);
    console.log(`📁 Output Directory: ${config.output}`);
    console.log(`📋 Output Format: ${config.format}`);
    console.log(`🔧 Debug Mode: ${config.debug ? "Enabled" : "Disabled"}`);
    console.log(
      `📝 Verbose Logging: ${config.verbose ? "Enabled" : "Disabled"}`
    );
  }

  async _executeImplementation() {
    // Simulate analysis with progress tracking
    const steps = [
      { name: "Initializing API client", duration: 500 },
      { name: "Fetching repository data", duration: 1500 },
      { name: "Processing commits", duration: 2000 },
      { name: "Analyzing contributors", duration: 1000 },
      { name: "Generating statistics", duration: 800 },
      { name: "Preparing reports", duration: 600 },
    ];

    console.log("\n📈 **Analysis Progress:**");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = (((i + 1) / steps.length) * 100).toFixed(1);

      process.stdout.write(`  ${i + 1}/${steps.length} ${step.name}...`);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, step.duration));

      console.log(` ✅ (${progress}%)`);

      if (this.#progressCallback) {
        await this.#progressCallback(progress, step.name);
      }
    }

    // Generate mock data
    const analysisData = this._generateEnhancedMockData();

    // Ensure output directory
    this._ensureOutputDirectory();

    // Export results
    await this._exportResults(analysisData);

    return analysisData;
  }

  async _afterExecute(result) {
    const config = this.config.getAll();

    console.log("\n✅ **Analysis Complete!**");
    console.log(`📊 Processed ${result.summary.totalItems} items`);
    console.log(`📁 Reports saved to: ${config.output}`);
    console.log(`⏱️  Total execution time: ${this._getExecutionTime()}`);

    if (config.verbose) {
      console.log("\n📋 **Detailed Results:**");
      console.log(`  - Active items: ${result.summary.activeItems}`);
      console.log(`  - Analysis type: ${result.summary.analysisType}`);
      console.log(`  - Data points: ${result.metrics.dataPoints}`);
      console.log(`  - Success rate: ${result.metrics.successRate}%`);
    }
  }

  async _onError(error) {
    console.error("\n❌ **Analysis Failed**");
    console.error(`Error: ${error.message}`);

    if (this.config.get("debug")) {
      console.error("\n🐛 **Debug Information:**");
      console.error(error.stack);
    }
  }

  // ===== PRIVATE METHODS =====
  _generateEnhancedMockData() {
    const config = this.config.getAll();
    const totalItems = Math.floor(Math.random() * 200) + 50;
    const activeItems = Math.floor(totalItems * (0.6 + Math.random() * 0.3));

    return {
      target: config.target,
      dateRange: {
        start: config.startDate,
        end: config.endDate,
      },
      summary: {
        totalItems,
        activeItems,
        analysisType: config.target.includes("/") ? "Repository" : "User",
      },
      metrics: {
        dataPoints: totalItems * Math.floor(Math.random() * 10 + 5),
        successRate: (85 + Math.random() * 15).toFixed(1),
        processingTime: this._getExecutionTime(),
        categories: {
          commits: Math.floor(totalItems * 0.4),
          pullRequests: Math.floor(totalItems * 0.3),
          issues: Math.floor(totalItems * 0.2),
          releases: Math.floor(totalItems * 0.1),
        },
      },
      performance: {
        apiCalls: Math.floor(totalItems / 10),
        cacheHits: Math.floor(Math.random() * 50 + 20),
        rateLimitRemaining: Math.floor(Math.random() * 4000 + 1000),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "2.0.0",
        configuration: this._sanitizeConfig(config),
        executionId: Math.random().toString(36).substr(2, 9),
      },
    };
  }

  _ensureOutputDirectory() {
    const outputDir = this.config.get("output");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}`);
    }
  }

  async _exportResults(data) {
    const format = this.config.get("format");
    const strategies = {
      json: () => this._exportJSON(data),
      csv: () => this._exportCSV(data),
      both: () => Promise.all([this._exportJSON(data), this._exportCSV(data)]),
    };

    await strategies[format]();
  }

  _exportJSON(data) {
    const filename = this._generateFilename("json");
    const filepath = join(this.config.get("output"), filename);

    const prettyJson = JSON.stringify(data, null, 2);
    writeFileSync(filepath, prettyJson);

    console.log(
      `📄 JSON report saved: ${filepath} (${this._getFileSize(
        prettyJson
      )} bytes)`
    );
  }

  _exportCSV(data) {
    const filename = this._generateFilename("csv");
    const filepath = join(this.config.get("output"), filename);

    // Enhanced CSV with more data
    const csvData = [
      ["Metric", "Value", "Category"],
      ["Target", data.target, "Basic"],
      ["Start Date", data.dateRange.start, "Date Range"],
      ["End Date", data.dateRange.end, "Date Range"],
      ["Total Items", data.summary.totalItems, "Summary"],
      ["Active Items", data.summary.activeItems, "Summary"],
      ["Analysis Type", data.summary.analysisType, "Summary"],
      ["Success Rate", `${data.metrics.successRate}%`, "Performance"],
      ["Data Points", data.metrics.dataPoints, "Performance"],
      ["API Calls", data.performance.apiCalls, "Performance"],
      ["Cache Hits", data.performance.cacheHits, "Performance"],
      [
        "Rate Limit Remaining",
        data.performance.rateLimitRemaining,
        "Performance",
      ],
      ["Commits", data.metrics.categories.commits, "Categories"],
      ["Pull Requests", data.metrics.categories.pullRequests, "Categories"],
      ["Issues", data.metrics.categories.issues, "Categories"],
      ["Releases", data.metrics.categories.releases, "Categories"],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    writeFileSync(filepath, csvData);
    console.log(
      `📊 CSV report saved: ${filepath} (${this._getFileSize(csvData)} bytes)`
    );
  }

  _generateFilename(extension) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const target = this.config.get("target") || "analysis";
    const safeName = target.replace(/[^a-zA-Z0-9-]/g, "-");
    const executionId = Math.random().toString(36).substr(2, 6);
    return `github-analysis-${safeName}-${timestamp}-${executionId}.${extension}`;
  }

  _formatFetchLimit(limit) {
    return limit === Number.MAX_SAFE_INTEGER ? "Unlimited" : limit.toString();
  }

  _getExecutionTime() {
    return `${Date.now() - this.metadata.createdAt}ms`;
  }

  _getFileSize(content) {
    return Buffer.byteLength(content, "utf8");
  }

  _sanitizeConfig(config) {
    const sanitized = { ...config };
    if (sanitized.token) {
      sanitized.token = "***REDACTED***";
    }
    return sanitized;
  }
}

// =============================================
// ENHANCED CLI APPLICATION FACADE
// =============================================

/**
 * Enhanced ExtensibleCLIApplication with plugin system and advanced features
 */
class ExtensibleCLIApplication extends EventEmitter {
  #parser;
  #configBuilder;
  #customCommands;
  #plugins;
  #middleware;
  #frozen;

  constructor() {
    super();
    this.#parser = new ExtensibleArgumentParser();
    this.#configBuilder = new ConfigurationBuilder();
    this.#customCommands = new Map();
    this.#plugins = new Map();
    this.#middleware = [];
    this.#frozen = false;

    this._setupEventHandlers();
  }

  // ===== EXTENSIBILITY METHODS =====
  addCustomOption(optionConfig) {
    this._ensureNotFrozen();
    this.#parser.addOption(optionConfig);
    this.emit("option:added", { optionConfig });
    return this;
  }

  addCustomOptions(optionConfigs) {
    this._ensureNotFrozen();
    this.#parser.addOptions(optionConfigs);
    this.emit("options:added", { count: optionConfigs.length });
    return this;
  }

  addCustomCommand(name, commandClass) {
    this._ensureNotFrozen();
    this.#customCommands.set(name, commandClass);
    this.emit("command:registered", { name, commandClass });
    return this;
  }

  // ===== PLUGIN SYSTEM =====
  addPlugin(name, plugin) {
    this._ensureNotFrozen();

    if (typeof plugin.initialize === "function") {
      plugin.initialize(this);
    }

    this.#plugins.set(name, plugin);
    this.emit("plugin:added", { name, plugin });
    return this;
  }

  getPlugin(name) {
    return this.#plugins.get(name);
  }

  // ===== MIDDLEWARE SYSTEM =====
  use(middleware) {
    this._ensureNotFrozen();

    if (typeof middleware !== "function") {
      throw new ConfigurationError("Middleware must be a function");
    }

    this.#middleware.push(middleware);
    this.emit("middleware:added", { middleware });
    return this;
  }

  // ===== CONFIGURATION =====
  setParserOptions(options) {
    this._ensureNotFrozen();
    this.#parser.setOptions(options);
    return this;
  }

  enableStrictMode() {
    return this.setParserOptions({ strictMode: true });
  }

  allowUnknownFlags() {
    return this.setParserOptions({ allowUnknownFlags: true });
  }

  // ===== MAIN EXECUTION =====
  async run(args = process.argv.slice(2)) {
    try {
      this.emit("app:start", { args });

      // Run middleware
      for (const middleware of this.#middleware) {
        await middleware(this, args);
      }

      // Parse arguments
      const parseResult = await this.#parser.parse(args);
      this.emit("parsing:complete", parseResult);

      // Handle parsing errors
      if (!parseResult.success) {
        await this._handleParsingErrors(parseResult);
        return;
      }

      // Show help if requested
      if (parseResult.shouldShowHelp) {
        const helpCommand = new HelpCommand(
          new Configuration({}),
          "",
          this.#parser
        );
        await helpCommand.execute();
        return;
      }

      // Build and validate configuration
      const config = this.#configBuilder
        .reset()
        .fromParsedConfig(parseResult.config)
        .fromEnvironment()
        .withDefaults()
        .validate()
        .build();

      this.emit("config:built", { config });

      // Create and execute command
      const command = this._createCommand(config, parseResult.analysisMode);
      const result = await command.execute();

      this.emit("app:complete", { result });
    } catch (error) {
      this.emit("app:error", { error });
      await this._handleError(error);
    }
  }

  // ===== COMMAND CREATION =====
  _createCommand(config, analysisMode) {
    // Check for custom commands first
    if (this.#customCommands.has(analysisMode)) {
      const CommandClass = this.#customCommands.get(analysisMode);
      return new CommandClass(config);
    }

    // Default to analysis command
    return new AnalysisCommand(config, (progress, step) => {
      this.emit("analysis:progress", { progress, step });
    });
  }

  // ===== ERROR HANDLING =====
  async _handleParsingErrors(parseResult) {
    console.error("\n❌ **Parsing Errors:**");
    parseResult.errors.forEach((error) => {
      console.error(`  • ${error.flag}: ${error.error} (${error.type})`);
    });

    if (parseResult.warnings.length > 0) {
      console.warn("\n⚠️  **Warnings:**");
      parseResult.warnings.forEach((warning) => {
        console.warn(`  • ${warning}`);
      });
    }

    console.error("\nUse --help for usage information.");
  }

  async _handleError(error) {
    const errorDetails = {
      message: error.message,
      type: error.constructor.name,
      code: error.code,
      timestamp: new Date().toISOString(),
    };

    console.error(`\n❌ **${errorDetails.type}:** ${errorDetails.message}`);

    if (error instanceof ArgumentValidationError) {
      console.error("\n🔍 **Validation Error Details:**");
      console.error("Please check your input parameters and try again.");
      if (error.field) {
        console.error(`Field: ${error.field}`);
      }
    } else if (error instanceof ConfigurationError) {
      console.error("\n⚙️  **Configuration Error Details:**");
      console.error(
        "Please check your configuration and environment variables."
      );
    } else if (error instanceof APIError) {
      console.error("\n🌐 **API Error Details:**");
      console.error(
        "GitHub API error. Please check your token and rate limits."
      );
      if (error.statusCode) {
        console.error(`Status Code: ${error.statusCode}`);
      }
    } else {
      console.error("\n🐛 **Unexpected Error:**");
      console.error("An unexpected error occurred.");
    }

    // Debug information
    if (process.env.DEBUG === "true") {
      console.error("\n🔧 **Debug Information:**");
      console.error(`Error Code: ${errorDetails.code || "N/A"}`);
      console.error(`Timestamp: ${errorDetails.timestamp}`);
      if (error.stack) {
        console.error("\n📋 **Stack Trace:**");
        console.error(error.stack);
      }
    }

    console.error("\nUse --help for usage information.");
    process.exit(1);
  }

  // ===== EVENT HANDLERS =====
  _setupEventHandlers() {
    this.on("analysis:progress", ({ progress, step }) => {
      // Can be overridden by plugins
    });

    this.on("app:error", ({ error }) => {
      // Error logging can be extended by plugins
    });
  }

  // ===== UTILITY METHODS =====
  freeze() {
    this.#frozen = true;
    this.#parser.freeze();
    this.emit("app:frozen");
    return this;
  }

  get isFrozen() {
    return this.#frozen;
  }

  get parser() {
    return this.#parser;
  }

  get configBuilder() {
    return this.#configBuilder;
  }

  // ===== PRIVATE METHODS =====
  _ensureNotFrozen() {
    if (this.#frozen) {
      throw new ConfigurationError(
        "Cannot modify frozen ExtensibleCLIApplication"
      );
    }
  }
}

// =============================================
// BUILT-IN PLUGINS
// =============================================

/**
 * Performance monitoring plugin
 */
class PerformancePlugin {
  constructor() {
    this.startTime = null;
    this.metrics = new Map();
  }

  initialize(app) {
    app.on("app:start", () => {
      this.startTime = process.hrtime.bigint();
      this.metrics.set("memoryStart", process.memoryUsage());
    });

    app.on("app:complete", () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - this.startTime) / 1000000; // Convert to ms
      const memoryEnd = process.memoryUsage();

      console.log("\n📊 **Performance Metrics:**");
      console.log(`⏱️  Total execution time: ${duration.toFixed(2)}ms`);
      console.log(
        `💾 Memory usage: ${(memoryEnd.heapUsed / 1024 / 1024).toFixed(2)}MB`
      );
      console.log(
        `🔄 Memory delta: ${(
          (memoryEnd.heapUsed - this.metrics.get("memoryStart").heapUsed) /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    });
  }
}

/**
 * Logging enhancement plugin
 */
class LoggingPlugin {
  initialize(app) {
    app.on("option:added", ({ optionConfig }) => {
      if (process.env.DEBUG === "true") {
        console.log(`🔧 Added option: ${optionConfig.flags?.[0] || "unknown"}`);
      }
    });

    app.on("config:built", ({ config }) => {
      if (config.get("verbose")) {
        console.log("\n⚙️  **Configuration Summary:**");
        const configData = config.getAll();
        Object.entries(configData).forEach(([key, value]) => {
          if (key === "token") {
            console.log(`  ${key}: ***REDACTED***`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
    });
  }
}

// =============================================
// EXAMPLE EXTENSIONS AND USAGE
// =============================================

/**
 * Create an extended CLI with custom options and plugins
 */
function createExtendedCLI() {
  const app = new ExtensibleCLIApplication();

  // Add performance monitoring
  app.addPlugin("performance", new PerformancePlugin());
  app.addPlugin("logging", new LoggingPlugin());

  // Example: Add custom team analysis option using builder pattern
  app.addCustomOption(
    StringArgumentOption.builder()
      .flags("--team")
      .description("Analyze specific team performance")
      .minLength(2)
      .handler(async (value, context) => {
        context.setState("team", value);
        context.setAnalysisMode("team");
      })
      .metadata("category", "advanced")
      .build()
  );

  // Example: Add custom organization option with validation
  app.addCustomOption(
    StringArgumentOption.builder()
      .flags("--org")
      .description("Organization context for analysis")
      .validator((value) => /^[a-zA-Z0-9-]+$/.test(value))
      .handler(async (value, context) => {
        context.setState("organization", value);
      })
      .metadata("category", "advanced")
      .build()
  );

  // Example: Add performance analysis option
  app.addCustomOption(
    BooleanArgumentOption.builder()
      .flags("--performance")
      .description("Enable performance metrics analysis")
      .handler(async (value, context) => {
        context.setState("includePerformanceMetrics", value);
        if (value) {
          console.log("🚀 Performance metrics analysis enabled");
        }
      })
      .metadata("category", "advanced")
      .build()
  );

  // Example: Add notification option with enum validation
  app.addCustomOption(
    EnumArgumentOption.builder()
      .flags("--notify")
      .description("Send notification on completion")
      .allowedValues("email", "slack", "webhook", "none")
      .defaultValue("none")
      .handler(async (value, context) => {
        context.setState("notificationMethod", value);
        context.queueExecution(async () => {
          if (value !== "none") {
            console.log(`📬 Notification method set to: ${value}`);
          }
        });
      })
      .metadata("category", "notifications")
      .build()
  );

  // Example: Add custom middleware for request logging
  app.use(async (app, args) => {
    if (process.env.DEBUG === "true") {
      console.log(`🔍 Processing arguments: ${args.join(" ")}`);
    }
  });

  return app;
}

// =============================================
// MAIN ENTRY POINT
// =============================================

/**
 * Main application entry point
 */
async function main() {
  try {
    // Create extended CLI with all enhancements
    const app = createExtendedCLI();

    // Enable advanced features
    app.enableStrictMode();

    // Run the application
    await app.run();
  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    if (process.env.DEBUG === "true") {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// =============================================
// EXPORTS FOR EXTERNAL USE
// =============================================

export {
  // Core Classes
  ArgumentOption,
  StringArgumentOption,
  NumberArgumentOption,
  BooleanArgumentOption,
  EnumArgumentOption,
  ArgumentOptionBuilder,
  ArgumentOptionFactory,

  // Registry and Parser
  ArgumentRegistry,
  ExtensibleArgumentParser,

  // Context and Configuration
  ParseContext,
  Configuration,
  ConfigurationBuilder,

  // Command System
  AbstractCommand,
  HelpCommand,
  AnalysisCommand,

  // Application Facade
  ExtensibleCLIApplication,

  // Validation System
  ValidationChain,
  ValidationStrategies,

  // Error Classes
  ArgumentError,
  ArgumentValidationError,
  ArgumentTransformationError,
  ArgumentExecutionError,
  ConfigurationError,
  APIError,

  // Type Definitions
  ArgumentTypes,

  // Plugins
  PerformancePlugin,
  LoggingPlugin,

  // Utilities
  createExtendedCLI,
};
