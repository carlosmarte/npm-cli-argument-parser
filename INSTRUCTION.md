```sh
node main.mjs --repo microsoft/typescript \
  --format both \
  --start 2024-01-01 \
  --end 2024-12-31 \
  --fetchLimit 100 \
  --verbose \
  --team frontend \
  --org microsoft \
  --notify slack
```

```sh
node main.mjs --user torvalds \
  --format csv \
  --performance \
  --debug
```

# Specialized Option Classes
```js
class StringArgumentOption extends ArgumentOption {
  minLength(length: number): StringArgumentOption
  maxLength(length: number): StringArgumentOption
  pattern(regex: RegExp, flags?: string): StringArgumentOption
}

class NumberArgumentOption extends ArgumentOption {
  range(min: number, max: number): NumberArgumentOption
}

class EnumArgumentOption extends ArgumentOption {
  get allowedValues(): any[]
}

class BooleanArgumentOption extends ArgumentOption {
  // Specialized for boolean flags
}
```

# ArgumentOptionBuilder
```js
class ArgumentOptionBuilder {
  flags(...flags: string[]): ArgumentOptionBuilder
  description(desc: string): ArgumentOptionBuilder
  type(type: ArgumentTypes): ArgumentOptionBuilder
  required(isRequired?: boolean): ArgumentOptionBuilder
  defaultValue(value: any): ArgumentOptionBuilder
  validator(validator: Validator): ArgumentOptionBuilder
  transformer(transformer: Function): ArgumentOptionBuilder
  handler(handler: Function): ArgumentOptionBuilder
  metadata(key: string | object, value?: any): ArgumentOptionBuilder
  
  build(): ArgumentOption
  buildAndFreeze(): ArgumentOption
}
```

# ValidationChain
```js
class ValidationChain {
  addValidator(validator: Validator): ValidationChain
  addValidators(validators: Validator[]): ValidationChain
  addTransformer(transformer: Function): ValidationChain
  
  validate(value: any, context?: object): boolean
  transform(value: any, context?: object): any
  
  getValidators(): Validator[]
  getTransformers(): Function[]
}
```

# Built-in Validation Strategies
```js
class ValidationStrategies {
  static STRING: Validator
  static BOOLEAN: Validator
  static NUMBER: Validator
  static INTEGER: Validator
  static FLOAT: Validator
  static ARRAY: Validator
  static PATH: Validator
  static FILE_PATH: Validator
  static DIR_PATH: Validator
  static URL: Validator
  static EMAIL: Validator
  static DATE: Validator
  static JSON: Validator
  
  static ENUM(allowedValues: any[]): Validator
  static REGEX(pattern: string | RegExp, flags?: string): Validator
  static RANGE(min: number, max: number): Validator
  static MIN_LENGTH(length: number): Validator
  static MAX_LENGTH(length: number): Validator
}
```

# ArgumentRegistry
```js
class ArgumentRegistry extends EventEmitter {
  register(option: ArgumentOption, category?: string): ArgumentRegistry
  registerBatch(options: ArgumentOption[], category?: string): ArgumentRegistry
  
  getByFlag(flag: string): ArgumentOption | undefined
  getAll(): ArgumentOption[]
  getByCategory(category: string): ArgumentOption[]
  getCategories(): string[]
  
  hasFlag(flag: string): boolean
  unregister(flag: string): boolean
  clear(): ArgumentRegistry
  freeze(): ArgumentRegistry
  
  getStats(): RegistryStats
}
```

# ExtensibleArgumentParser
```js
class ExtensibleArgumentParser extends EventEmitter {
  constructor(registry?: ArgumentRegistry)
  
  setOptions(options: ParserOptions): ExtensibleArgumentParser
  enableStrictMode(): ExtensibleArgumentParser
  allowUnknownFlags(): ExtensibleArgumentParser
  
  addOption(optionConfig: OptionConfig): ExtensibleArgumentParser
  addOptions(optionConfigs: OptionConfig[]): ExtensibleArgumentParser
  
  async parse(args?: string[]): Promise<ParseResult>
  generateHelp(): string
  
  freeze(): ExtensibleArgumentParser
  get registry(): ArgumentRegistry
}
```

# ParseContext
```js
class ParseContext extends EventEmitter {
  // Configuration setters
  setTarget(value: string): void
  setAnalysisMode(mode: string): void
  setOutputFormat(format: string): void
  setOutputDirectory(dir: string): void
  setVerbose(value: boolean): void
  setDebug(value: boolean): void
  setStartDate(date: string): void
  setEndDate(date: string): void
  setToken(token: string): void
  setFetchLimit(limit: number): void
  
  // Help system
  showHelp(): void
  get shouldShowHelp(): boolean
  
  // Execution queue
  queueExecution(fn: Function, priority?: number): void
  async executeAll(): Promise<ExecutionResult[]>
  clearQueue(): void
  
  // State management
  setState(key: string, value: any): void
  getState(key: string): any
  hasState(key: string): boolean
  deleteState(key: string): boolean
  
  // Configuration access
  getConfiguration(): object
  getFullState(): object
  
  // Immutability
  freeze(): ParseContext
}
```

# Configuration
```js
class Configuration {
  constructor(options?: object)
  
  get(key: string): any
  getAll(): object
  getMetadata(): object
  has(key: string): boolean
  
  validate(): Configuration
  freeze(): Configuration
  
  toJSON(): object
  static fromJSON(json: string | object): Configuration
}
```

# ConfigurationBuilder
```js
class ConfigurationBuilder {
  reset(): ConfigurationBuilder
  fromParsedConfig(config: object): ConfigurationBuilder
  fromEnvironment(): ConfigurationBuilder
  withDefaults(): ConfigurationBuilder
  
  target(target: string): ConfigurationBuilder
  format(format: string): ConfigurationBuilder
  output(output: string): ConfigurationBuilder
  token(token: string): ConfigurationBuilder
  dateRange(start: string, end: string): ConfigurationBuilder
  verbose(enabled?: boolean): ConfigurationBuilder
  debug(enabled?: boolean): ConfigurationBuilder
  
  addValidator(validator: Function): ConfigurationBuilder
  validate(): ConfigurationBuilder
  
  build(): Configuration
  buildAndFreeze(): Configuration
  buildAndValidate(): Configuration
}
```

# AbstractCommand
```js
abstract class AbstractCommand extends EventEmitter {
  constructor(config: Configuration)
  
  get config(): Configuration
  get metadata(): object
  
  async execute(): Promise<any>
  
  // Template method hooks
  async _beforeExecute(): Promise<void>
  async _executeImplementation(): Promise<any>  // Abstract
  async _afterExecute(result: any): Promise<void>
  async _onError(error: Error): Promise<void>
  
  // State management
  setState(key: string, value: any): void
  getState(key: string): any
  hasState(key: string): boolean
}
```

# ExtensibleCLIApplication
```js
class ExtensibleCLIApplication extends EventEmitter {
  // Extensibility
  addCustomOption(optionConfig: OptionConfig): ExtensibleCLIApplication
  addCustomOptions(optionConfigs: OptionConfig[]): ExtensibleCLIApplication
  addCustomCommand(name: string, commandClass: Class): ExtensibleCLIApplication
  
  // Plugin system
  addPlugin(name: string, plugin: Plugin): ExtensibleCLIApplication
  getPlugin(name: string): Plugin
  
  // Middleware system
  use(middleware: Function): ExtensibleCLIApplication
  
  // Configuration
  setParserOptions(options: ParserOptions): ExtensibleCLIApplication
  enableStrictMode(): ExtensibleCLIApplication
  allowUnknownFlags(): ExtensibleCLIApplication
  
  // Execution
  async run(args?: string[]): Promise<void>
  
  // Utility
  freeze(): ExtensibleCLIApplication
  get parser(): ExtensibleArgumentParser
  get configBuilder(): ConfigurationBuilder
}
```

# ArgumentTypes
```js
const ArgumentTypes = {
  STRING: 'string',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  INTEGER: 'integer',
  FLOAT: 'float',
  ARRAY: 'array',
  ENUM: 'enum',
  PATH: 'path',
  FILE_PATH: 'file_path',
  DIR_PATH: 'dir_path',
  URL: 'url',
  EMAIL: 'email',
  DATE: 'date',
  JSON: 'json',
  REGEX: 'regex'
};
```

# Error Classes
```js
class ArgumentError extends Error
class ArgumentValidationError extends ArgumentError
class ArgumentTransformationError extends ArgumentError
class ArgumentExecutionError extends ArgumentError
class ConfigurationError extends ArgumentError
class APIError extends ArgumentError
```

# Event System
```md

The framework extensively uses the EventEmitter pattern for extensibility and monitoring:
ArgumentOption Events

processing:start
processing:complete
processing:error

ArgumentRegistry Events

option:registered
option:unregistered
batch:registered
registry:cleared
registry:frozen

ExtensibleArgumentParser Events

parsing:start
parsing:complete
parsing:error
option:registered

ParseContext Events

config:changed
mode:changed
help:requested
execution:start
execution:complete
execution:item:success
execution:item:error
state:changed
context:frozen

ExtensibleCLIApplication Events

app:start
app:complete
app:error
option:added
command:registered
plugin:added
middleware:added
config:built
analysis:progress
```

# Plugin Interface
```js
interface Plugin {
  initialize?(app: ExtensibleCLIApplication): void
  [key: string]: any
}
```

# ArgumentOptionFactory
```js
class ArgumentOptionFactory {
  static string(config: OptionConfig): StringArgumentOption
  static number(config: OptionConfig): NumberArgumentOption
  static boolean(config: OptionConfig): BooleanArgumentOption
  static enum(config: OptionConfig): EnumArgumentOption
  static create(type: ArgumentTypes, config: OptionConfig): ArgumentOption
}
```

# String Options with Validation
```js
import { 
  StringArgumentOption, 
  ValidationStrategies,
  ExtensibleCLIApplication 
} from './main.mjs';

const app = new ExtensibleCLIApplication();

// Email option with validation
const emailOption = StringArgumentOption.builder()
  .flags('--email', '-e')
  .description('Email address for notifications')
  .validator(ValidationStrategies.EMAIL)
  .required()
  .handler(async (value, context) => {
    context.setState('notificationEmail', value);
    console.log(`📧 Notifications will be sent to: ${value}`);
  })
  .build();

app.addCustomOption(emailOption);


// # Number Options with Range Validation

import { NumberArgumentOption } from './main.mjs';

const portOption = NumberArgumentOption.builder()
  .flags('--port', '-p')
  .description('Server port number')
  .range(1000, 65535)
  .defaultValue(3000)
  .transformer((value) => parseInt(value, 10))
  .handler(async (value, context) => {
    context.setState('serverPort', value);
  })
  .build();

app.addCustomOption(portOption);


// # Enum Options for Multiple Choices

import { EnumArgumentOption } from './main.mjs';

const logLevelOption = EnumArgumentOption.builder()
  .flags('--log-level')
  .description('Set logging level')
  .allowedValues('error', 'warn', 'info', 'debug', 'trace')
  .defaultValue('info')
  .handler(async (value, context) => {
    context.setState('logLevel', value);
    console.log(`📝 Log level set to: ${value}`);
  })
  .build();

app.addCustomOption(logLevelOption);


// # Complex Validation Chains

import { 
  StringArgumentOption, 
  ValidationStrategies 
} from './main.mjs';

const apiKeyOption = StringArgumentOption.builder()
  .flags('--api-key')
  .description('API key for external service')
  .minLength(16)
  .maxLength(64)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .transformer((value) => value.trim().toUpperCase())
  .validator((value) => {
    // Custom validation logic
    if (value.startsWith('TEST_')) {
      console.warn('⚠️  Using test API key');
    }
    return true;
  })
  .handler(async (value, context) => {
    context.setState('apiKey', value);
  })
  .build();

app.addCustomOption(apiKeyOption);


// # Basic Custom Command

import { AbstractCommand } from './main.mjs';

class DatabaseMigrationCommand extends AbstractCommand {
  async _executeImplementation() {
    console.log('🗄️  Starting database migration...');
    
    const steps = [
      'Backing up current database',
      'Applying schema changes',
      'Migrating data',
      'Verifying integrity',
      'Cleanup and optimization'
    ];

    for (let i = 0; i < steps.length; i++) {
      console.log(`  ${i + 1}/${steps.length} ${steps[i]}...`);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`  ✅ ${steps[i]} completed`);
    }

    return {
      success: true,
      migratedTables: 15,
      affectedRows: 10523
    };
  }

  async _afterExecute(result) {
    console.log('\n✅ Database migration completed!');
    console.log(`📊 Migrated ${result.migratedTables} tables`);
    console.log(`📈 Affected ${result.affectedRows} rows`);
  }

  async _onError(error) {
    console.error('❌ Database migration failed!');
    console.error(`Reason: ${error.message}`);
    
    // Rollback logic could go here
  }
}

// Register the custom command
app.addCustomCommand('migrate', DatabaseMigrationCommand);

// Add the option to trigger it
app.addCustomOption({
  flags: ['--migrate'],
  description: 'Run database migration',
  type: 'boolean',
  handler: async (value, context) => {
    if (value) {
      context.setAnalysisMode('migrate');
    }
  }
});


// # Command with Progress Tracking

import { AbstractCommand } from './main.mjs';

class DataProcessingCommand extends AbstractCommand {
  async _executeImplementation() {
    const totalFiles = this.config.get('fileCount') || 100;
    const results = [];

    console.log(`📁 Processing ${totalFiles} files...`);

    for (let i = 0; i < totalFiles; i++) {
      const progress = ((i + 1) / totalFiles * 100).toFixed(1);
      
      // Emit progress event
      this.emit('progress', {
        current: i + 1,
        total: totalFiles,
        percentage: progress,
        currentFile: `file_${i + 1}.json`
      });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      results.push({
        file: `file_${i + 1}.json`,
        status: Math.random() > 0.1 ? 'success' : 'warning',
        size: Math.floor(Math.random() * 10000) + 1000
      });

      // Update progress display
      if (i % 10 === 0 || i === totalFiles - 1) {
        process.stdout.write(`\r  Progress: ${'█'.repeat(Math.floor(progress / 5))}${' '.repeat(20 - Math.floor(progress / 5))} ${progress}%`);
      }
    }

    console.log('\n');
    return results;
  }
}

// Usage with progress listener
const command = new DataProcessingCommand(config);
command.on('progress', ({ percentage, currentFile }) => {
  if (config.get('verbose')) {
    console.log(`Processing ${currentFile} (${percentage}%)`);
  }
});


// # Monitoring Plugin

class MonitoringPlugin {
  constructor(options = {}) {
    this.options = {
      enableMetrics: true,
      enableHealthChecks: true,
      ...options
    };
    this.metrics = new Map();
  }

  initialize(app) {
    // Track application lifecycle
    app.on('app:start', (data) => {
      this.metrics.set('startTime', Date.now());
      console.log('📊 Monitoring plugin activated');
    });

    app.on('app:complete', (data) => {
      const duration = Date.now() - this.metrics.get('startTime');
      console.log(`📈 Application completed in ${duration}ms`);
      
      if (this.options.enableMetrics) {
        this._reportMetrics();
      }
    });

    // Track option processing
    app.parser.on('parsing:complete', (result) => {
      this.metrics.set('optionsProcessed', result.config ? Object.keys(result.config).length : 0);
    });

    // Health check endpoint (if needed)
    if (this.options.enableHealthChecks) {
      this._setupHealthCheck(app);
    }
  }

  _reportMetrics() {
    console.log('\n📊 **Performance Metrics:**');
    console.log(`⏱️  Execution time: ${Date.now() - this.metrics.get('startTime')}ms`);
    console.log(`⚙️  Options processed: ${this.metrics.get('optionsProcessed') || 0}`);
    console.log(`💾 Memory usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  _setupHealthCheck(app) {
    // Could set up HTTP endpoint or file-based health check
    console.log('🏥 Health check system enabled');
  }
}

// Usage
const app = new ExtensibleCLIApplication();
app.addPlugin('monitoring', new MonitoringPlugin({
  enableMetrics: true,
  enableHealthChecks: false
}));
```

# Configuration Validation Plugin
```js
class ConfigValidationPlugin {
  initialize(app) {
    app.on('config:built', ({ config }) => {
      this._validateConfiguration(config);
    });
  }

  _validateConfiguration(config) {
    const warnings = [];
    const errors = [];

    // Check for common configuration issues
    if (config.get('debug') && !config.get('verbose')) {
      warnings.push('Debug mode is enabled but verbose mode is not. Consider enabling verbose mode for better debugging.');
    }

    if (config.get('fetchLimit') > 1000) {
      warnings.push('High fetch limit detected. This may impact performance and rate limits.');
    }

    if (!config.get('token')) {
      errors.push('GitHub token is required. Set GITHUB_TOKEN environment variable.');
    }

    // Report issues
    if (warnings.length > 0) {
      console.warn('\n⚠️  **Configuration Warnings:**');
      warnings.forEach(warning => console.warn(`  • ${warning}`));
    }

    if (errors.length > 0) {
      console.error('\n❌ **Configuration Errors:**');
      errors.forEach(error => console.error(`  • ${error}`));
      throw new Error('Configuration validation failed');
    }

    console.log('✅ Configuration validation passed');
  }
}

app.addPlugin('configValidation', new ConfigValidationPlugin());
```

# Named Imports - Core Classes
```js
// Import specific classes you need
import { 
  ArgumentOption,
  StringArgumentOption,
  NumberArgumentOption,
  BooleanArgumentOption,
  EnumArgumentOption,
  ExtensibleCLIApplication 
} from './main.mjs';

// Basic usage
const app = new ExtensibleCLIApplication();
await app.run();
```

# Named Imports - Validation System
```js
// Import validation components
import { 
  ValidationStrategies,
  ValidationChain,
  ArgumentTypes,
  ArgumentValidationError
} from './main.mjs';

// Create custom validation chain
const emailChain = new ValidationChain();
emailChain
  .addValidator(ValidationStrategies.EMAIL)
  .addValidator(ValidationStrategies.MIN_LENGTH(5))
  .addTransformer((value) => value.toLowerCase());

try {
  emailChain.validate('USER@EXAMPLE.COM');
  const result = emailChain.transform('USER@EXAMPLE.COM');
  console.log(result); // 'user@example.com'
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

# Named Imports - Factory and Builder Patterns
```js
// Import factory and builder classes
import { 
  ArgumentOptionFactory,
  ArgumentOptionBuilder,
  StringArgumentOptionBuilder,
  ConfigurationBuilder
} from './main.mjs';

// Using factory pattern
const stringOption = ArgumentOptionFactory.string({
  flags: ['--name'],
  description: 'User name',
  required: true
});

// Using builder pattern
const numberOption = new ArgumentOptionBuilder()
  .flags('--port')
  .type(ArgumentTypes.NUMBER)
  .defaultValue(3000)
  .build();

// Using specialized builder
const emailOption = new StringArgumentOptionBuilder()
  .flags('--email')
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  .required()
  .build();
```

# Comprehensive Import - Full Framework
```js
// Import everything for complex applications
import { 
  // Core Classes
  ArgumentOption,
  StringArgumentOption,
  NumberArgumentOption,
  BooleanArgumentOption,
  EnumArgumentOption,
  
  // Registry and Parser
  ArgumentRegistry,
  ExtensibleArgumentParser,
  
  // Configuration System
  Configuration,
  ConfigurationBuilder,
  ParseContext,
  
  // Command System
  AbstractCommand,
  HelpCommand,
  AnalysisCommand,
  
  // Application Framework
  ExtensibleCLIApplication,
  
  // Validation Framework
  ValidationChain,
  ValidationStrategies,
  
  // Error Classes
  ArgumentError,
  ArgumentValidationError,
  ConfigurationError,
  
  // Utilities
  ArgumentTypes,
  ArgumentOptionFactory,
  PerformancePlugin,
  LoggingPlugin,
  createExtendedCLI
} from './main.mjs';
```

# Basic ArgumentOption Creation and Usage
```js
import { ArgumentOption, ArgumentTypes, ParseContext } from './main.mjs';

// Create a basic argument option
const verboseOption = new ArgumentOption({
  flags: ['-v', '--verbose'],
  description: 'Enable verbose logging',
  type: ArgumentTypes.BOOLEAN,
  defaultValue: false,
  handler: async (value, context) => {
    console.log(`Verbose mode: ${value ? 'enabled' : 'disabled'}`);
    context.setVerbose(value);
  },
  metadata: {
    category: 'logging',
    priority: 1
  }
});

// Use the option
const context = new ParseContext();

// Process the option
try {
  const result = await verboseOption.process(true, context);
  console.log('Option processed successfully:', result);
} catch (error) {
  console.error('Option processing failed:', error.message);
}

// Check option properties
console.log('Flags:', verboseOption.flags);
console.log('Primary flag:', verboseOption.primaryFlag);
console.log('Description:', verboseOption.description);
console.log('Type:', verboseOption.type);
console.log('Is required:', verboseOption.required);
console.log('Metadata:', verboseOption.metadata);
```

# ArgumentOption with Custom Validation
```js
import { ArgumentOption, ArgumentValidationError } from './main.mjs';

const customOption = new ArgumentOption({
  flags: ['--thread-count'],
  description: 'Number of processing threads',
  type: ArgumentTypes.INTEGER,
  defaultValue: 4,
  validators: [
    {
      validate: (value) => value > 0,
      message: 'Thread count must be positive'
    },
    {
      validate: (value) => value <= 16,
      message: 'Thread count cannot exceed 16'
    }
  ],
  transformers: [
    (value) => parseInt(value, 10),
    (value) => Math.min(value, require('os').cpus().length)
  ],
  handler: async (value, context) => {
    context.setState('threadCount', value);
    console.log(`Using ${value} threads for processing`);
    return value;
  }
});

// Test with different values
const testValues = ['-1', '4', '20', 'invalid'];

for (const testValue of testValues) {
  try {
    const result = await customOption.process(testValue, new ParseContext());
    console.log(`✅ Value '${testValue}' processed successfully: ${result}`);
  } catch (error) {
    console.log(`❌ Value '${testValue}' failed: ${error.message}`);
  }
}
```

# ArgumentOption Event Handling
```js
import { ArgumentOption } from './main.mjs';

const monitoredOption = new ArgumentOption({
  flags: ['--database-url'],
  description: 'Database connection URL',
  type: ArgumentTypes.URL,
  required: true
});

// Listen to processing events
monitoredOption.on('processing:start', ({ flag, rawValue }) => {
  console.log(`🚀 Starting to process ${flag} with value: ${rawValue}`);
});

monitoredOption.on('processing:complete', ({ flag, result }) => {
  console.log(`✅ Successfully processed ${flag}: ${result}`);
});

monitoredOption.on('processing:error', ({ flag, error }) => {
  console.error(`❌ Error processing ${flag}: ${error.message}`);
});

// Process the option with event monitoring
const context = new ParseContext();
await monitoredOption.process('postgresql://user:pass@localhost:5432/db', context);
```

# ArgumentOption Method Chaining
```js
import { ArgumentOption } from './main.mjs';

const chainedOption = new ArgumentOption({
  flags: ['--api-endpoint'],
  description: 'API endpoint URL',
  type: ArgumentTypes.URL
});

// Chain validation and transformation methods
chainedOption
  .addValidator({
    validate: (url) => new URL(url).protocol === 'https:',
    message: 'API endpoint must use HTTPS'
  })
  .addValidator({
    validate: (url) => !new URL(url).hostname.includes('localhost'),
    message: 'Production endpoints cannot use localhost'
  })
  .addTransformer((url) => {
    const urlObj = new URL(url);
    // Ensure trailing slash
    if (!urlObj.pathname.endsWith('/')) {
      urlObj.pathname += '/';
    }
    return urlObj.toString();
  })
  .freeze(); // Prevent further modifications

// Test the chained option
try {
  const result = await chainedOption.process('https://api.example.com', new ParseContext());
  console.log('Final URL:', result);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

# StringArgumentOption Advanced Usage
```js
import { StringArgumentOption, ValidationStrategies } from './main.mjs';

// Email validation with custom domain checking
const emailOption = new StringArgumentOption({
  flags: ['--email', '-e'],
  description: 'User email address',
  required: true
});

// Add string-specific validations
emailOption
  .minLength(5)
  .maxLength(100)
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'g')
  .addValidator({
    validate: (email) => {
      const allowedDomains = ['company.com', 'contractor.company.com'];
      const domain = email.split('@')[1];
      return allowedDomains.includes(domain);
    },
    message: 'Email must be from an approved domain'
  })
  .addTransformer((email) => email.toLowerCase().trim());

// Usage example
const testEmails = [
  'john.doe@company.com',
  'JANE.DOE@COMPANY.COM',
  'contractor@contractor.company.com',
  'external@gmail.com'
];

for (const email of testEmails) {
  try {
    const result = await emailOption.process(email, new ParseContext());
    console.log(`✅ Email '${email}' processed: ${result}`);
  } catch (error) {
    console.log(`❌ Email '${email}' rejected: ${error.message}`);
  }
}
```

# NumberArgumentOption with Range Validation
```js
import { NumberArgumentOption } from './main.mjs';

// Port number with smart defaults
const portOption = new NumberArgumentOption({
  flags: ['--port', '-p'],
  description: 'Server port number',
  defaultValue: () => {
    // Dynamic default based on environment
    return process.env.NODE_ENV === 'production' ? 80 : 3000;
  }
});

// Add number-specific validations
portOption
  .range(1, 65535)
  .addValidator({
    validate: (port) => {
      // Check if port is available (simplified check)
      const reservedPorts = [22, 25, 53, 80, 443, 993, 995];
      if (reservedPorts.includes(port) && process.env.NODE_ENV === 'production') {
        return false;
      }
      return true;
    },
    message: 'Port conflicts with system reserved ports in production'
  })
  .addTransformer((port) => {
    // Ensure integer
    return Math.floor(Number(port));
  });

// Test different port values
const testPorts = ['3000', '80', '8080', '65536', 'invalid'];

for (const port of testPorts) {
  try {
    const result = await portOption.process(port, new ParseContext());
    console.log(`✅ Port '${port}' accepted: ${result}`);
  } catch (error) {
    console.log(`❌ Port '${port}' rejected: ${error.message}`);
  }
}
```

# EnumArgumentOption with Dynamic Values
```js
import { EnumArgumentOption } from './main.mjs';

// Log level with environment-aware values
const getLogLevels = () => {
  const baseLevels = ['error', 'warn', 'info'];
  if (process.env.NODE_ENV === 'development') {
    baseLevels.push('debug', 'trace');
  }
  return baseLevels;
};

const logLevelOption = new EnumArgumentOption({
  flags: ['--log-level'],
  description: 'Set application log level',
  allowedValues: getLogLevels(),
  defaultValue: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  handler: async (value, context) => {
    context.setState('logLevel', value);
    
    // Configure actual logger
    console.log(`📝 Log level set to: ${value}`);
    if (value === 'debug') {
      console.log('🐛 Debug logging enabled - performance may be impacted');
    }
    
    return value;
  }
});

// Display available values
console.log('Available log levels:', logLevelOption.allowedValues);

// Test enum validation
const testLevels = ['info', 'debug', 'verbose', 'trace'];

for (const level of testLevels) {
  try {
    const result = await logLevelOption.process(level, new ParseContext());
    console.log(`✅ Log level '${level}' set: ${result}`);
  } catch (error) {
    console.log(`❌ Log level '${level}' invalid: ${error.message}`);
  }
}
```

# BooleanArgumentOption with State Management
```js
import { BooleanArgumentOption } from './main.mjs';

const featureFlagOption = new BooleanArgumentOption({
  flags: ['--enable-feature-x'],
  description: 'Enable experimental feature X',
  defaultValue: false,
  handler: async (value, context) => {
    context.setState('featureXEnabled', value);
    
    if (value) {
      console.log('🧪 Experimental feature X enabled');
      console.log('⚠️  This feature is in beta - use with caution');
      
      // Check dependencies
      const requiredFeatures = context.getState('requiredFeatures') || [];
      if (!requiredFeatures.includes('feature-y')) {
        console.warn('⚠️  Feature X works best with Feature Y enabled');
      }
    } else {
      console.log('🔒 Feature X disabled (default behavior)');
    }
    
    return value;
  }
});

// Boolean options don't need values in CLI
const context = new ParseContext();
context.setState('requiredFeatures', ['feature-y']);

// Simulate CLI flag presence
await featureFlagOption.process(true, context);
```

# Basic Builder Pattern
```js
import { ArgumentOptionBuilder, ArgumentTypes } from './main.mjs';

// Step-by-step option building
const builder = new ArgumentOptionBuilder();

const complexOption = builder
  .flags('--database-config')
  .description('Database configuration file path')
  .type(ArgumentTypes.FILE_PATH)
  .required(true)
  .validator((path) => path.endsWith('.json') || path.endsWith('.yaml'))
  .transformer((path) => require('path').resolve(path))
  .handler(async (path, context) => {
    const fs = await import('fs');
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    context.setState('databaseConfig', config);
    return config;
  })
  .metadata('category', 'configuration')
  .metadata('priority', 1)
  .buildAndFreeze();

console.log('Built option:', complexOption.primaryFlag);
console.log('Metadata:', complexOption.metadata);
```

# Specialized Builder Usage
```js
import { 
  StringArgumentOptionBuilder,
  NumberArgumentOptionBuilder,
  EnumArgumentOptionBuilder 
} from './main.mjs';

// String option with advanced validation
const usernameOption = new StringArgumentOptionBuilder()
  .flags('--username', '-u')
  .description('Username for authentication')
  .minLength(3)
  .maxLength(20)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .required()
  .transformer((username) => username.toLowerCase())
  .handler(async (username, context) => {
    // Check if username exists (mock)
    const existingUsers = ['admin', 'guest', 'test'];
    if (existingUsers.includes(username)) {
      throw new Error(`Username '${username}' already exists`);
    }
    context.setState('username', username);
    return username;
  })
  .build();

// Number option with smart defaults
const timeoutOption = new NumberArgumentOptionBuilder()
  .flags('--timeout')
  .description('Request timeout in seconds')
  .range(1, 300)
  .defaultValue(() => {
    // Dynamic default based on environment
    return process.env.NODE_ENV === 'production' ? 30 : 60;
  })
  .transformer((value) => value * 1000) // Convert to milliseconds
  .build();

// Enum option with conditional values
const environmentOption = new EnumArgumentOptionBuilder()
  .flags('--env', '--environment')
  .description('Deployment environment')
  .allowedValues('development', 'staging', 'production')
  .defaultValue('development')
  .handler(async (env, context) => {
    context.setState('environment', env);
    
    // Set environment-specific defaults
    if (env === 'production') {
      context.setState('logLevel', 'warn');
      context.setState('debugMode', false);
    } else {
      context.setState('logLevel', 'debug');
      context.setState('debugMode', true);
    }
    
    return env;
  })
  .buildAndFreeze();

// Test the built options
const testCases = [
  { option: usernameOption, value: 'john_doe_123' },
  { option: timeoutOption, value: '45' },
  { option: environmentOption, value: 'production' }
];

for (const { option, value } of testCases) {
  try {
    const result = await option.process(value, new ParseContext());
    console.log(`✅ ${option.primaryFlag}: ${value} → ${result}`);
  } catch (error) {
    console.log(`❌ ${option.primaryFlag}: ${value} → ${error.message}`);
  }
}
```

# Conditional Builder Pattern
```js
import { ArgumentOptionBuilder, ArgumentTypes } from './main.mjs';

// Builder with conditional logic
const createApiOption = (environment) => {
  const builder = new ArgumentOptionBuilder()
    .flags('--api-url')
    .description('API base URL')
    .type(ArgumentTypes.URL);

  if (environment === 'production') {
    builder
      .required(true)
      .validator((url) => new URL(url).protocol === 'https:')
      .validator((url) => !new URL(url).hostname.includes('localhost'));
  } else {
    builder
      .defaultValue('http://localhost:3000')
      .validator((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
  }

  return builder
    .handler(async (url, context) => {
      context.setState('apiUrl', url);
      console.log(`🌐 API URL set to: ${url}`);
    })
    .build();
};

// Create different options for different environments
const devApiOption = createApiOption('development');
const prodApiOption = createApiOption('production');

console.log('Dev option required:', devApiOption.required);
console.log('Prod option required:', prodApiOption.required);
console.log('Dev option default:', devApiOption.defaultValue);
console.log('Prod option default:', prodApiOption.defaultValue);
```

# Builder Chain with Validation Pipeline
```js
import { StringArgumentOptionBuilder, ValidationStrategies } from './main.mjs';

// Complex validation pipeline using builder
const passwordOption = new StringArgumentOptionBuilder()
  .flags('--password')
  .description('User password')
  .minLength(8)
  .maxLength(128)
  .required(true)
  // Add multiple validators
  .validator(ValidationStrategies.MIN_LENGTH(8))
  .validator({
    validate: (password) => /[A-Z]/.test(password),
    message: 'Password must contain at least one uppercase letter'
  })
  .validator({
    validate: (password) => /[a-z]/.test(password),
    message: 'Password must contain at least one lowercase letter'
  })
  .validator({
    validate: (password) => /\d/.test(password),
    message: 'Password must contain at least one number'
  })
  .validator({
    validate: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    message: 'Password must contain at least one special character'
  })
  .validator({
    validate: (password) => {
      const commonPasswords = ['password', '123456', 'qwerty'];
      return !commonPasswords.includes(password.toLowerCase());
    },
    message: 'Password is too common'
  })
  // Hash the password before storing
  .transformer(async (password) => {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  })
  .handler(async (hashedPassword, context) => {
    context.setState('passwordHash', hashedPassword);
    console.log('🔐 Password validated and hashed successfully');
    return '***REDACTED***'; // Don't return the actual hash
  })
  .metadata('security', 'high')
  .metadata('category', 'authentication')
  .buildAndFreeze();

// Test password validation
const testPasswords = [
  'weak',
  'StrongPassword123!',
  'password',
  'NoNumbers!',
  'nonumbers123',
  'ALLUPPERCASE123!',
  'ValidPassword123!'
];

for (const password of testPasswords) {
  try {
    const result = await passwordOption.process(password, new ParseContext());
    console.log(`✅ Password validated: ${result}`);
  } catch (error) {
    console.log(`❌ Password rejected: ${error.message}`);
  }
}
```

# Basic Registry Usage
```js
import { ArgumentRegistry, StringArgumentOption, BooleanArgumentOption } from './main.mjs';

// Create a custom registry
const registry = new ArgumentRegistry();

// Listen to registry events
registry.on('option:registered', ({ option, category }) => {
  console.log(`📝 Registered option ${option.primaryFlag} in category: ${category}`);
});

registry.on('batch:registered', ({ results, category }) => {
  console.log(`📦 Batch registered ${results.length} options in category: ${category}`);
});

// Register individual options
const verboseOption = new BooleanArgumentOption({
  flags: ['-v', '--verbose'],
  description: 'Enable verbose output'
});

const outputOption = new StringArgumentOption({
  flags: ['-o', '--output'],
  description: 'Output file path'
});

registry.register(verboseOption, 'logging');
registry.register(outputOption, 'output');

// Register batch options
const networkOptions = [
  new StringArgumentOption({
    flags: ['--host'],
    description: 'Server hostname',
    defaultValue: 'localhost'
  }),
  new StringArgumentOption({
    flags: ['--port'],
    description: 'Server port',
    defaultValue: '8080'
  })
];

registry.registerBatch(networkOptions, 'network');

// Query the registry
console.log('All categories:', registry.getCategories());
console.log('Logging options:', registry.getByCategory('logging').map(opt => opt.primaryFlag));
console.log('Registry stats:', registry.getStats());

// Check flag existence
console.log('Has --verbose:', registry.hasFlag('--verbose'));
console.log('Has --invalid:', registry.hasFlag('--invalid'));

// Get option by flag
const foundOption = registry.getByFlag('--output');
console.log('Found option description:', foundOption?.description);
```

# ExtensibleArgumentParser Advanced Usage
```js
import { 
  ExtensibleArgumentParser,
  ArgumentRegistry,
  StringArgumentOption,
  NumberArgumentOption 
} from './main.mjs';

// Create parser with custom registry
const customRegistry = new ArgumentRegistry();
const parser = new ExtensibleArgumentParser(customRegistry);

// Configure parser options
parser
  .enableStrictMode()
  .setOptions({
    caseSensitive: true,
    stopAtFirstPositional: false
  });

// Listen to parser events
parser.on('parsing:start', ({ args }) => {
  console.log('🚀 Starting to parse:', args.join(' '));
});

parser.on('parsing:complete', (result) => {
  console.log('✅ Parsing completed successfully');
  console.log('Parsed config:', result.config);
  console.log('Positional args:', result.positionalArgs);
});

parser.on('parsing:error', ({ error, parseState }) => {
  console.error('❌ Parsing failed:', error.message);
  console.error('Parse state:', parseState);
});

// Add options to parser
parser
  .addOption({
    flags: ['--input', '-i'],
    description: 'Input file path',
    type: 'string',
    required: true,
    handler: async (value, context) => {
      console.log(`📁 Input file: ${value}`);
      context.setState('inputFile', value);
    }
  })
  .addOption({
    flags: ['--workers'],
    description: 'Number of worker processes',
    type: 'number',
    defaultValue: 4,
    handler: async (value, context) => {
      console.log(`👥 Using ${value} workers`);
      context.setState('workerCount', value);
    }
  });

// Test parsing different argument combinations
const testCases = [
  ['--input', 'data.txt', '--workers', '8'],
  ['--input', 'data.txt'], // Default workers
  ['--invalid-flag'], // Should handle gracefully in non-strict mode
  [] // Missing required input
];

for (const args of testCases) {
  try {
    console.log(`\n🧪 Testing: ${args.join(' ')}`);
    const result = await parser.parse(args);
    
    if (result.success) {
      console.log('✅ Success');
    } else {
      console.log('⚠️  Parsing completed with errors:', result.errors);
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
}
```

# Registry Organization and Management
```js
import { ArgumentRegistry } from './main.mjs';

class OrganizedRegistry extends ArgumentRegistry {
  constructor() {
    super();
    this.clear(); // Remove default options for custom organization
    this._setupCustomCategories();
  }

  _setupCustomCategories() {
    // Input/Output options
    this.registerBatch([
      {
        flags: ['--input-file', '-i'],
        description: 'Input file path',
        type: 'file_path',
        required: true
      },
      {
        flags: ['--output-dir', '-o'],
        description: 'Output directory',
        type: 'dir_path',
        defaultValue: './output'
      },
      {
        flags: ['--format'],
        description: 'Output format',
        type: 'enum',
        allowedValues: ['json', 'xml', 'csv'],
        defaultValue: 'json'
      }
    ].map(config => this._createOption(config)), 'io');

    // Processing options
    this.registerBatch([
      {
        flags: ['--threads'],
        description: 'Number of processing threads',
        type: 'integer',
        defaultValue: 1
      },
      {
        flags: ['--memory-limit'],
        description: 'Memory limit in MB',
        type: 'integer',
        defaultValue: 1024
      },
      {
        flags: ['--timeout'],
        description: 'Processing timeout in seconds',
        type: 'integer',
        defaultValue: 300
      }
    ].map(config => this._createOption(config)), 'processing');

    // Debug and logging
    this.registerBatch([
      {
        flags: ['--verbose', '-v'],
        description: 'Enable verbose logging',
        type: 'boolean'
      },
      {
        flags: ['--debug'],
        description: 'Enable debug mode',
        type: 'boolean'
      },
      {
        flags: ['--log-file'],
        description: 'Log file path',
        type: 'string'
      }
    ].map(config => this._createOption(config)), 'logging');
  }

  _createOption(config) {
    // Helper method to create options from config
    return ArgumentOptionFactory.create(config.type, config);
  }

  // Enhanced query methods
  getOptionsByPattern(pattern) {
    return this.getAll().filter(option => 
      option.flags.some(flag => flag.match(pattern))
    );
  }

  getRequiredOptions() {
    return this.getAll().filter(option => option.required);
  }

  getBooleanOptions() {
    return this.getAll().filter(option => option.type === 'boolean');
  }

  generateCategoryReport() {
    const report = {};
    
    for (const category of this.getCategories()) {
      const options = this.getByCategory(category);
      report[category] = {
        count: options.length,
        required: options.filter(opt => opt.required).length,
        withDefaults: options.filter(opt => opt.defaultValue !== undefined).length,
        flags: options.map(opt => opt.primaryFlag)
      };
    }
    
    return report;
  }
}

// Usage example
const registry = new OrganizedRegistry();

console.log('Category report:', registry.generateCategoryReport());
console.log('Boolean options:', registry.getBooleanOptions().map(opt => opt.primaryFlag));
console.log('Required options:', registry.getRequiredOptions().map(opt => opt.primaryFlag));
console.log('Input options:', registry.getOptionsByPattern(/^--input/).map(opt => opt.primaryFlag));
```

# Parser with Custom Error Handling
```js
import { 
  ExtensibleArgumentParser,
  ArgumentValidationError,
  ConfigurationError 
} from './main.mjs';

class RobustParser extends ExtensibleArgumentParser {
  constructor() {
    super();
    this.errorLog = [];
    this.warningLog = [];
    this._setupErrorHandling();
  }

  _setupErrorHandling() {
    this.on('parsing:error', ({ error, parseState }) => {
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        type: error.constructor.name,
        parseState: { ...parseState }
      });
    });
  }

  async parseWithRecovery(args) {
    try {
      return await this.parse(args);
    } catch (error) {
      if (error instanceof ArgumentValidationError) {
        return this._handleValidationError(error, args);
      } else if (error instanceof ConfigurationError) {
        return this._handleConfigError(error, args);
      } else {
        throw error; // Re-throw unknown errors
      }
    }
  }

  _handleValidationError(error, args) {
    console.warn(`⚠️  Validation error: ${error.message}`);
    
    // Try to suggest corrections
    const suggestions = this._suggestCorrections(error, args);
    if (suggestions.length > 0) {
      console.log('💡 Suggestions:');
      suggestions.forEach(suggestion => console.log(`   ${suggestion}`));
    }

    // Return partial result
    return {
      success: false,
      config: {},
      errors: [error.message],
      warnings: [],
      suggestions,
      recovery: 'partial'
    };
  }

  _handleConfigError(error, args) {
    console.warn(`⚠️  Configuration error: ${error.message}`);
    
    // Provide default configuration
    const defaultConfig = this._getDefaultConfig();
    
    return {
      success: false,
      config: defaultConfig,
      errors: [error.message],
      warnings: ['Using default configuration'],
      recovery: 'default'
    };
  }

  _suggestCorrections(error, args) {
    const suggestions = [];
    
    // Look for similar flag names
    const allFlags = this.registry.getAll().flatMap(opt => opt.flags);
    
    args.forEach(arg => {
      if (arg.startsWith('-') && !this.registry.hasFlag(arg)) {
        const similar = allFlags.filter(flag => 
          this._levenshteinDistance(arg, flag) <= 2
        );
        
        if (similar.length > 0) {
          suggestions.push(`Did you mean '${similar[0]}' instead of '${arg}'?`);
        }
      }
    });

    return suggestions;
  }

  _levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  _getDefaultConfig() {
    return {
      verbose: false,
      debug: false,
      output: './output',
      format: 'json'
    };
  }

  getErrorReport() {
    return {
      errors: this.errorLog,
      warnings: this.warningLog,
      errorCount: this.errorLog.length,
      warningCount: this.warningLog.length
    };
  }
}

// Usage example
const parser = new RobustParser();

// Add some options
parser.addOptions([
  {
    flags: ['--input'],
    description: 'Input file',
    type: 'string',
    required: true
  },
  {
    flags: ['--verbose'],
    description: 'Verbose output',
    type: 'boolean'
  }
]);

// Test with various problematic inputs
const testCases = [
  ['--input', 'file.txt', '--verbose'],  // Valid
  ['--inpu', 'file.txt'],                // Typo in flag
  ['--verbose'],                         // Missing required input
  ['--unknown-flag', 'value']            // Unknown flag
];

for (const args of testCases) {
  console.log(`\n🧪 Testing: ${args.join(' ')}`);
  const result = await parser.parseWithRecovery(args);
  
  console.log(`Result: ${result.success ? 'Success' : 'Failed with recovery'}`);
  if (result.suggestions) {
    console.log('Suggestions:', result.suggestions);
  }
}

console.log('\n📊 Error Report:', parser.getErrorReport());
```

# Configuration Class Usage
```js
import { Configuration, ConfigurationBuilder } from './main.mjs';

// Basic configuration creation
const basicConfig = new Configuration({
  target: 'facebook/react',
  format: 'json',
  verbose: true,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Access configuration values
console.log('Target:', basicConfig.get('target'));
console.log('Format:', basicConfig.get('format'));
console.log('All config:', basicConfig.getAll());
console.log('Has token:', basicConfig.has('token'));
console.log('Metadata:', basicConfig.getMetadata());

// Validate configuration
try {
  basicConfig.validate();
  console.log('✅ Configuration is valid');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
}

// Freeze configuration to prevent changes
const frozenConfig = basicConfig.freeze();
console.log('Is frozen:', frozenConfig.isFrozen);

// Serialization
const configJson = frozenConfig.toJSON();
console.log('Serialized config:', JSON.stringify(configJson, null, 2));

// Deserialization
const restoredConfig = Configuration.fromJSON(configJson);
console.log('Restored target:', restoredConfig.get('target'));
```

# Environment Integration
```js
import { ConfigurationBuilder } from './main.mjs';

// Set up environment variables for testing
process.env.GITHUB_TOKEN = 'test_token_123';
process.env.VERBOSE = 'true';
process.env.OUTPUT_DIR = '/tmp/analysis';
process.env.DEBUG = 'false';

// Create configuration with environment integration
const envConfig = new ConfigurationBuilder()
  .fromEnvironment()
  .withDefaults()
  .addValidator((config) => {
    // Validate environment-specific settings
    if (process.env.NODE_ENV === 'production' && config.debug) {
      return 'Debug mode should not be enabled in production';
    }
    return true;
  })
  .buildAndValidate();

console.log('Environment-based config:', envConfig.getAll());

// Environment override example
const overrideConfig = new ConfigurationBuilder()
  .target('default/repo')
  .verbose(false)
  .fromEnvironment() // This will override the above values if env vars exist
  .withDefaults()
  .build();

console.log('Override example:', overrideConfig.getAll());
```

# Dynamic Configuration
```js
import { Configuration, ConfigurationBuilder } from './main.mjs';

class DynamicConfiguration extends Configuration {
  constructor(options = {}) {
    super(options);
    this.computedValues = new Map();
    this._setupComputedProperties();
  }

  _setupComputedProperties() {
    // Define computed properties that update based on other values
    this.computedValues.set('isProduction', () => 
      this.get('environment') === 'production'
    );
    
    this.computedValues.set('maxWorkers', () => {
      const baseWorkers = this.get('workers') || 4;
      const isProduction = this.getComputed('isProduction');
      return isProduction ? Math.min(baseWorkers, 8) : baseWorkers;
    });
    
    this.computedValues.set('logLevel', () => {
      if (this.get('debug')) return 'debug';
      if (this.get('verbose')) return 'info';
      return this.getComputed('isProduction') ? 'warn' : 'info';
    });
    
    this.computedValues.set('timeoutMs', () => {
      const timeout = this.get('timeout') || 30;
      const isProduction = this.getComputed('isProduction');
      return isProduction ? timeout * 1000 : (timeout * 1.5) * 1000;
    });
  }

  getComputed(key) {
    const computer = this.computedValues.get(key);
    if (!computer) {
      throw new Error(`Unknown computed property: ${key}`);
    }
    return computer();
  }

  getAllComputed() {
    const computed = {};
    for (const [key] of this.computedValues) {
      computed[key] = this.getComputed(key);
    }
    return computed;
  }

  getFullConfiguration() {
    return {
      ...this.getAll(),
      computed: this.getAllComputed()
    };
  }
}

// Usage example
const dynamicConfig = new DynamicConfiguration({
  environment: 'development',
  workers: 6,
  timeout: 45,
  debug: true,
  verbose: false
});

console.log('Full configuration:', dynamicConfig.getFullConfiguration());

// Change environment and see computed values update
const prodConfig = new DynamicConfiguration({
  environment: 'production',
  workers: 12,
  timeout: 30,
  debug: false,
  verbose: true
});

console.log('Production configuration:', prodConfig.getFullConfiguration());
```

# Custom Command Implementation
```js
import { AbstractCommand, Configuration } from './main.mjs';

class DataProcessingCommand extends AbstractCommand {
  constructor(config) {
    super(config);
    this.processingStats = {
      startTime: null,
      endTime: null,
      itemsProcessed: 0,
      errors: 0,
      warnings: 0
    };
  }

  async _beforeExecute() {
    this.processingStats.startTime = Date.now();
    console.log('🚀 Starting data processing...');
    
    // Validate prerequisites
    const inputFile = this.config.get('inputFile');
    if (!inputFile) {
      throw new Error('Input file is required for data processing');
    }

    // Setup processing environment
    await this._setupProcessingEnvironment();
  }

  async _executeImplementation() {
    const batchSize = this.config.get('batchSize') || 100;
    const maxItems = this.config.get('maxItems') || 1000;
    
    console.log(`📊 Processing up to ${maxItems} items in batches of ${batchSize}`);

    const results = [];
    
    for (let batch = 0; batch < Math.ceil(maxItems / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, maxItems);
      
      console.log(`🔄 Processing batch ${batch + 1}: items ${batchStart}-${batchEnd}`);
      
      try {
        const batchResult = await this._processBatch(batchStart, batchEnd);
        results.push(batchResult);
        this.processingStats.itemsProcessed += batchResult.processed;
        
        // Emit progress event
        this.emit('progress', {
          batch: batch + 1,
          totalBatches: Math.ceil(maxItems / batchSize),
          itemsProcessed: this.processingStats.itemsProcessed,
          percentage: (this.processingStats.itemsProcessed / maxItems) * 100
        });

        // Optional delay between batches to prevent overwhelming the system
        if (this.config.get('batchDelay')) {
          await new Promise(resolve => setTimeout(resolve, this.config.get('batchDelay')));
        }

      } catch (error) {
        this.processingStats.errors++;
        console.error(`❌ Batch ${batch + 1} failed:`, error.message);
        
        if (this.config.get('stopOnError')) {
          throw error;
        } else {
          console.log('⚠️  Continuing with next batch...');
        }
      }
    }

    return {
      results,
      stats: this.processingStats,
      success: this.processingStats.errors === 0
    };
  }

  async _processBatch(start, end) {
    // Simulate processing work
    const items = [];
    for (let i = start; i < end; i++) {
      // Simulate some processing logic
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        items.push({
          id: i,
          status: 'processed',
          data: `processed_data_${i}`
        });
      } else {
        this.processingStats.warnings++;
        items.push({
          id: i,
          status: 'warning',
          message: 'Processing completed with warnings'
        });
      }

      // Simulate processing time
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return {
      batchStart: start,
      batchEnd: end,
      processed: items.filter(item => item.status === 'processed').length,
      warnings: items.filter(item => item.status === 'warning').length,
      items
    };
  }

  async _afterExecute(result) {
    this.processingStats.endTime = Date.now();
    const duration = this.processingStats.endTime - this.processingStats.startTime;

    console.log('\n✅ Data processing completed!');
    console.log(`📊 Statistics:`);
    console.log(`   Total items processed: ${this.processingStats.itemsProcessed}`);
    console.log(`   Errors: ${this.processingStats.errors}`);
    console.log(`   Warnings: ${this.processingStats.warnings}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Items/sec: ${(this.processingStats.itemsProcessed / (duration / 1000)).toFixed(2)}`);

    // Save results if output path specified
    const outputPath = this.config.get('output');
    if (outputPath) {
      await this._saveResults(result, outputPath);
    }
  }

  async _onError(error) {
    this.processingStats.endTime = Date.now();
    console.error('❌ Data processing failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Items processed before failure: ${this.processingStats.itemsProcessed}`);

    // Attempt cleanup
    await this._cleanup();
  }

  async _setupProcessingEnvironment() {
    // Setup temporary directories, database connections, etc.
    console.log('🔧 Setting up processing environment...');
    
    const tempDir = this.config.get('tempDir') || '/tmp/processing';
    this.setState('tempDir', tempDir);
    
    // Create temp directory if it doesn't exist
    const fs = await import('fs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  async _saveResults(result, outputPath) {
    console.log(`💾 Saving results to ${outputPath}...`);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save detailed results
    const outputData = {
      summary: {
        itemsProcessed: this.processingStats.itemsProcessed,
        errors: this.processingStats.errors,
        warnings: this.processingStats.warnings,
        duration: this.processingStats.endTime - this.processingStats.startTime
      },
      configuration: this.config.getAll(),
      results: result.results,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✅ Results saved to ${outputPath}`);
  }

  async _cleanup() {
    console.log('🧹 Performing cleanup...');
    
    const tempDir = this.getState('tempDir');
    if (tempDir) {
      // Clean up temporary files
      console.log(`Cleaning up temporary directory: ${tempDir}`);
    }
  }
}

// Usage example
const config = new Configuration({
  inputFile: 'data.csv',
  batchSize: 50,
  maxItems: 500,
  batchDelay: 100,
  stopOnError: false,
  output: './results/processing-results.json',
  tempDir: './temp'
});

const command = new DataProcessingCommand(config);

// Listen to progress events
command.on('progress', ({ batch, totalBatches, itemsProcessed, percentage }) => {
  console.log(`Progress: Batch ${batch}/${totalBatches} (${percentage.toFixed(1)}%) - ${itemsProcessed} items processed`);
});

// Execute the command
try {
  const result = await command.execute();
  console.log('Command completed successfully:', result.success);
} catch (error) {
  console.error('Command failed:', error.message);
}
```

# Command with Dependency Injection
```js
import { AbstractCommand } from './main.mjs';

class ServiceDependentCommand extends AbstractCommand {
  constructor(config, dependencies = {}) {
    super(config);
    this.dependencies = {
      logger: dependencies.logger || console,
      httpClient: dependencies.httpClient || this._createDefaultHttpClient(),
      database: dependencies.database || this._createMockDatabase(),
      eventBus: dependencies.eventBus || this._createEventBus(),
      ...dependencies
    };
  }

  async _executeImplementation() {
    const { logger, httpClient, database, eventBus } = this.dependencies;

    logger.info('🚀 Starting service-dependent operation...');

    // Step 1: Fetch data from API
    logger.info('📡 Fetching data from external API...');
    const apiData = await this._fetchFromAPI(httpClient);
    
    eventBus.emit('data:fetched', { count: apiData.length });

    // Step 2: Process and store data
    logger.info('💾 Processing and storing data...');
    const processedData = await this._processAndStore(apiData, database);
    
    eventBus.emit('data:processed', { processed: processedData.length });

    // Step 3: Generate report
    logger.info('📊 Generating report...');
    const report = await this._generateReport(processedData);
    
    eventBus.emit('report:generated', { report });

    return {
      apiData: apiData.length,
      processedData: processedData.length,
      report,
      success: true
    };
  }

  async _fetchFromAPI(httpClient) {
    const endpoint = this.config.get('apiEndpoint') || 'https://api.example.com/data';
    const response = await httpClient.get(endpoint);
    
    // Simulate API response
    return Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.random() * 100
    }));
  }

  async _processAndStore(data, database) {
    const processed = [];
    
    for (const item of data) {
      // Apply business logic
      const processedItem = {
        ...item,
        processed: true,
        processedAt: new Date().toISOString(),
        score: item.value * 1.5
      };

      // Store in database
      await database.save('processed_items', processedItem);
      processed.push(processedItem);
    }

    return processed;
  }

  async _generateReport(data) {
    const totalItems = data.length;
    const averageScore = data.reduce((sum, item) => sum + item.score, 0) / totalItems;
    const maxScore = Math.max(...data.map(item => item.score));
    const minScore = Math.min(...data.map(item => item.score));

    return {
      totalItems,
      averageScore: averageScore.toFixed(2),
      maxScore: maxScore.toFixed(2),
      minScore: minScore.toFixed(2),
      generatedAt: new Date().toISOString()
    };
  }

  _createDefaultHttpClient() {
    return {
      async get(url) {
        // Mock HTTP client
        console.log(`HTTP GET: ${url}`);
        return { data: [] };
      },
      async post(url, data) {
        console.log(`HTTP POST: ${url}`, data);
        return { success: true };
      }
    };
  }

  _createMockDatabase() {
    const storage = new Map();
    
    return {
      async save(table, data) {
        if (!storage.has(table)) {
          storage.set(table, []);
        }
        storage.get(table).push({ ...data, _id: Date.now() });
        return data;
      },
      async find(table, query = {}) {
        return storage.get(table) || [];
      },
      async count(table) {
        return (storage.get(table) || []).length;
      }
    };
  }

  _createEventBus() {
    const EventEmitter = require('events');
    return new EventEmitter();
  }
}

// Usage with custom dependencies
const customLogger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};

const customHttpClient = {
  async get(url) {
    console.log(`🌐 Custom HTTP GET: ${url}`);
    // Could use axios, fetch, or any other HTTP library
    return { data: Array.from({ length: 50 }, (_, i) => ({ id: i, value: Math.random() })) };
  }
};

const config = new Configuration({
  apiEndpoint: 'https://custom-api.example.com/data'
});

const command = new ServiceDependentCommand(config, {
  logger: customLogger,
  httpClient: customHttpClient
});

// Execute with custom dependencies
const result = await command.execute();
console.log('Final result:', result);
```

# Command Pipeline
```js
import { AbstractCommand, Configuration } from './main.mjs';

class PipelineCommand extends AbstractCommand {
  constructor(config, steps = []) {
    super(config);
    this.steps = steps;
    this.pipelineState = new Map();
  }

  async _executeImplementation() {
    console.log(`🔄 Starting pipeline with ${this.steps.length} steps...`);

    const results = [];
    let previousResult = null;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const stepName = step.name || `Step ${i + 1}`;

      try {
        console.log(`📍 Executing ${stepName}...`);
        
        // Execute step with previous result as input
        const stepResult = await this._executeStep(step, previousResult, i);
        
        results.push({
          stepName,
          index: i,
          success: true,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        previousResult = stepResult;
        
        this.emit('step:completed', { stepName, index: i, result: stepResult });

      } catch (error) {
        console.error(`❌ Step ${stepName} failed:`, error.message);
        
        results.push({
          stepName,
          index: i,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Check if pipeline should continue on error
        if (step.continueOnError !== true) {
          throw new Error(`Pipeline failed at step ${stepName}: ${error.message}`);
        }

        this.emit('step:failed', { stepName, index: i, error });
        previousResult = null; // Reset for next step
      }
    }

    return {
      totalSteps: this.steps.length,
      completedSteps: results.filter(r => r.success).length,
      failedSteps: results.filter(r => !r.success).length,
      results,
      finalResult: previousResult,
      pipelineState: Object.fromEntries(this.pipelineState)
    };
  }

  async _executeStep(step, input, index) {
    // Create step context
    const stepContext = {
      input,
      index,
      config: this.config,
      state: this.pipelineState,
      emit: (event, data) => this.emit(event, { step: index, ...data })
    };

    // Execute step function
    if (typeof step.execute === 'function') {
      return await step.execute(stepContext);
    } else if (typeof step === 'function') {
      return await step(stepContext);
    } else {
      throw new Error(`Invalid step at index ${index}: must be function or object with execute method`);
    }
  }

  addStep(step) {
    this.steps.push(step);
    return this;
  }

  insertStep(index, step) {
    this.steps.splice(index, 0, step);
    return this;
  }

  removeStep(index) {
    this.steps.splice(index, 1);
    return this;
  }
}

// Define pipeline steps
const dataValidationStep = {
  name: 'Data Validation',
  async execute({ input, state, emit }) {
    emit('validation:start');
    
    // Simulate validation
    const data = input || { items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() })) };
    
    const validItems = data.items.filter(item => item.value > 0.1);
    const invalidItems = data.items.length - validItems.length;
    
    if (invalidItems > data.items.length * 0.5) {
      throw new Error(`Too many invalid items: ${invalidItems}/${data.items.length}`);
    }

    state.set('validationResults', { valid: validItems.length, invalid: invalidItems });
    
    emit('validation:complete', { valid: validItems.length, invalid: invalidItems });
    
    return { validItems, validationPassed: true };
  }
};

const dataTransformationStep = {
  name: 'Data Transformation',
  continueOnError: true,
  async execute({ input, state, emit }) {
    emit('transformation:start');
    
    if (!input?.validItems) {
      throw new Error('No valid items to transform');
    }

    const transformedItems = input.validItems.map(item => ({
      ...item,
      transformed: true,
      score: item.value * 100,
      category: item.value > 0.5 ? 'high' : 'low'
    }));

    state.set('transformationResults', { transformed: transformedItems.length });
    
    emit('transformation:complete', { transformed: transformedItems.length });
    
    return { transformedItems };
  }
};

const dataAggregationStep = {
  name: 'Data Aggregation',
  async execute({ input, state, emit }) {
    emit('aggregation:start');
    
    if (!input?.transformedItems) {
      throw new Error('No transformed items to aggregate');
    }

    const aggregation = {
      total: input.transformedItems.length,
      highCategory: input.transformedItems.filter(item => item.category === 'high').length,
      lowCategory: input.transformedItems.filter(item => item.category === 'low').length,
      averageScore: input.transformedItems.reduce((sum, item) => sum + item.score, 0) / input.transformedItems.length
    };

    state.set('aggregationResults', aggregation);
    
    emit('aggregation:complete', aggregation);
    
    return { aggregation, processedAt: new Date().toISOString() };
  }
};

// Create and configure pipeline
const config = new Configuration({
  pipelineName: 'Data Processing Pipeline',
  maxRetries: 3
});

const pipeline = new PipelineCommand(config, [
  dataValidationStep,
  dataTransformationStep,
  dataAggregationStep
]);

// Listen to pipeline events
pipeline.on('step:completed', ({ stepName, result }) => {
  console.log(`✅ ${stepName} completed successfully`);
});

pipeline.on('step:failed', ({ stepName, error }) => {
  console.log(`❌ ${stepName} failed: ${error.message}`);
});

pipeline.on('validation:complete', ({ valid, invalid }) => {
  console.log(`📊 Validation: ${valid} valid, ${invalid} invalid items`);
});

pipeline.on('transformation:complete', ({ transformed }) => {
  console.log(`🔄 Transformed ${transformed} items`);
});

pipeline.on('aggregation:complete', (aggregation) => {
  console.log(`📈 Aggregation: ${aggregation.total} total, avg score: ${aggregation.averageScore.toFixed(2)}`);
});

// Execute pipeline
try {
  const result = await pipeline.execute();
  console.log('\n🎉 Pipeline completed successfully!');
  console.log(`Total steps: ${result.totalSteps}`);
  console.log(`Completed: ${result.completedSteps}`);
  console.log(`Failed: ${result.failedSteps}`);
  console.log('Final result:', result.finalResult);
} catch (error) {
  console.error('\n💥 Pipeline failed:', error.message);
}
```