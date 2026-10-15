import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

/** 简单 camelCase → snake_case 转换 */
function snakeCase(s: string): string {
  return s
    .replace(/([A-Z])/g, '_$1')
    .replace(/[\s-]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase();
}

function tableNameOf(tableOrName: string | { name?: string }): string {
  if (typeof tableOrName === 'string') return tableOrName;
  return tableOrName?.name ?? '';
}

/**
 * 自实现 Snake 命名策略（typeorm-extension 3.x 已移除该导出）。
 * 继承 DefaultNamingStrategy 并重写关键命名方法。
 */
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName: string): string {
    return customName || snakeCase(className);
  }

  columnName(propertyName: string, customName: string): string {
    return customName || snakeCase(propertyName);
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return snakeCase(
      `${firstTableName}_${firstPropertyName}_${secondTableName}`,
    );
  }

  joinTableColumnName(tableName: string, propertyName: string): string {
    return snakeCase(`${tableName}_${propertyName}`);
  }

  foreignKeyName(
    tableOrName: string,
    columnNames: string[],
  ): string {
    const name = columnNames.join('_');
    return `fk_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(name)}`;
  }

  primaryKeyName(tableOrName: string, columnNames: string[]): string {
    const name = columnNames.join('_');
    return `pk_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(name)}`;
  }

  uniqueConstraintName(tableOrName: string, columnNames: string[]): string {
    const name = columnNames.join('_');
    return `uk_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(name)}`;
  }

  indexName(tableOrName: string, columns: string[]): string {
    const name = columns.join('_');
    return `idx_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(name)}`;
  }

  checkConstraintName(tableOrName: string, expression: string): string {
    return `ck_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(expression).slice(0, 20)}`;
  }

  exclusionConstraintName(tableOrName: string, expression: string): string {
    return `excl_${snakeCase(tableNameOf(tableOrName))}_${snakeCase(expression).slice(0, 20)}`;
  }

  propertyName(propertyName: string, customName: string): string {
    return customName || snakeCase(propertyName);
  }
}
