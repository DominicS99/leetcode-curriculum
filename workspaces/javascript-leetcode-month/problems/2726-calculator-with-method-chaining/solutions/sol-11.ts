interface Calculator {
  new (value: number): this;
  add(value: number): this;
  subtract(value: number): this;
  multiply(value: number): this;
  divide(value: number): this;
  power(value: number): this;
  getResult(): number;
}

class Calculator {
  constructor(private value: number) {}

  getResult(): number {
    return this.value;
  }
}

const METHOD_OPERATORS = {
  add: "+",
  subtract: "-",
  multiply: "*",
  divide: "/",
  power: "**",
} as const;

const VALIDATIONS: Partial<
  Record<keyof typeof METHOD_OPERATORS, (value: number) => void>
> = {
  divide(value: number) {
    if (value === 0) {
      throw new Error("Division by zero is not allowed");
    }
  },
};

for (const [name, operator] of Object.entries(METHOD_OPERATORS) as [
  keyof typeof METHOD_OPERATORS,
  string,
][]) {
  Calculator.prototype[name as keyof Calculator] = eval(`
    (function ${name}(value) {
      VALIDATIONS[${JSON.stringify(name)}]?.(value);
      this.value ${operator}= value;
      return this;
    })
  `);
}
