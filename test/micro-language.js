/*
  Add:      (+ 10 2)
  Subtract: (- 10 2)
  Multiply: (* 10 2)
  Divide:   (/ 10 2)
  Nest calculations: (+ (* 10 2) (- (/ 50 3) 2))
  ( ( 10 * 2) + ( ( 50 / 3) - 2))
*/
const { digits, str, choice, sequenceOf, between, lazy } = require('../lib/index.js');

const betweenBrackets = between(str('('), str(')'));

const numberParser = digits.map(x => ({
  type: 'number',
  value: Number(x),
}));

const operatorParser = choice([str('+'), str('-'), str('*'), str('/')]);

const expr = lazy(() => choice([
  numberParser,
  operationParser
]))

const operationParser = betweenBrackets(sequenceOf([
  operatorParser,
  str(' '),
  expr,
  str(' '),
  expr,
])).map(result => ({
  type: 'operations',
  value: {
    op: result[0],
    a: result[2],
    b: result[4],
  }
}))

const evaluate = node => {
  if (node.type === "number") return node.value;
  if (node.type === "operations") {
    if (node.value.op === '+') return evaluate(node.value.a) + evaluate(node.value.b);
    if (node.value.op === '-') return evaluate(node.value.a) - evaluate(node.value.b);
    if (node.value.op === '*') return evaluate(node.value.a) * evaluate(node.value.b);
    if (node.value.op === '/') return evaluate(node.value.a) / evaluate(node.value.b);
  }
};

const interpretator = programm => {
  const parseResult = expr.run(programm);
  if (parseResult.isError) throw new Error('invalid programm');
  return evaluate(parseResult.result)
}

const programm = '(+ (* 10 2) (- (/ 50 3) 2))';

// console.log(JSON.stringify(expr.run(programm), null, '  '));
console.log(interpretator(programm));
