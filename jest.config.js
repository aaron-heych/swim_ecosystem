/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        // 单元测试使用 mock 仓储（as any），关闭 ts 诊断避免类型噪音
        diagnostics: false,
      },
    ],
  },
};
