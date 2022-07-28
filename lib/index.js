const updateParserResult = (state, result) => ({
  ...state, result 
 });
const updateParserState = (state, index, result) => ({ 
 ...state, index, result 
});
const updateParserError = (state, errorMsg) => ({ 
 ...state, isError: true, error: errorMsg 
});

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run(targetString) {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      isError: false,
      error: null,
    };

    return this.parserStateTransformerFn(initialState);
  }


  map(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);
      if (nextState.isError) return nextState;
      return updateParserResult(nextState, fn(nextState.result));
    });
  }
  
  chain(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);
      if (nextState.isError) return nextState;
      const nextParser = fn(nextState.result);
      return nextParser.parserStateTransformerFn(nextState);

    })
  }

  errorMap(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);
      if (!nextState.isError) return nextState;
      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }


}

const str = s => new Parser(parserState => {
  const { targetString, index, isError } = parserState;
  if (isError) return parserState;
  const sliceTarget = targetString.slice(index);
  if (sliceTarget.length === 0) return updateParserError(
    parserState,
    'str: Tried to match "${s}", but got unexpected end of input.'
  );
  if (sliceTarget.startsWith(s)) return updateParserState(
    parserState, index + s.length, s
    );

  return updateParserError(
    parserState,
    `str: Tried to match "${s}", but got "${targetString.slice(index, index + 15)}"`
  );
});

const letterRegex = /^[A-Za-z]+/;

const letters = new Parser(parserState => {
  const {
    targetString,
    index,
    isError,
  } = parserState;

  if (isError) return parserState;
  const sliceTarget = targetString.slice(index);
  if (sliceTarget.length === 0) return updateParserError(
    parserState,
    'letters: Got unexpected end of input.'
  );
  const regexMatch = sliceTarget.match(letterRegex);
  if (regexMatch) return updateParserState( 
    parserState, index + regexMatch[0].length, regexMatch[0]
  );

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const digitsRegex = /^[0-9]+/;

const digits = new Parser(parserState => {
  const {
    targetString,
    index,
    isError,
  } = parserState;

  if (isError) return parserState;
  const sliceTarget = targetString.slice(index);
  if (sliceTarget.length === 0) return updateParserError(
    parserState,
    'digits: Got unexpected end of input.'
  );
  const regexMatch = sliceTarget.match(digitsRegex);
  if (regexMatch) return updateParserState(
    parserState, index + regexMatch[0].length, regexMatch[0]
  );

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
  );
});

const sequenceOf = parsers => new Parser(parserState => {
  if(parserState.isError) return parserState;
  const results = [];
  let nextState = parserState;
  
  for (let p of parsers) {
    nextState = p.parserStateTransformerFn(nextState);
    results.push(nextState.result);
  }
  return updateParserResult(nextState, results);
});

const choice = parsers => new Parser(parserState => {
  if(parserState.isError) return parserState;
  
  for (let p of parsers) {
    const nextState = p.parserStateTransformerFn(parserState);
    if (!nextState.isError) return nextState;
  }

  return updateParserError(
    parserState,
    `choice: Unable to match with any parser at index ${parserState.index}`
  );
});

const many = parser => new Parser(parserState => {
  if(parserState.isError) return parserState;
  let nextState = parserState;
  const results = [];
  let done = false;

  while(!done) {
    let testState = parser.parserStateTransformerFn(nextState);
    if (!testState.isError) {
      results.push(testState.result);
      nextState = testState
    } else {
      done = true;
    }
  };

  if (results.length === 0) return updateParserError(
    parserState,
    `many: Unable to match any input parser at index ${parserState.index}`
  )

  return updateParserResult(nextState, results)
});

const many1 = parser => new Parser(parserState => {
  if (parserState.isError) return parserState;

  let nextState = parserState;
  const results = [];
  let done = false;

  while (!done) {
    const nextState = parser.parserStateTransformerFn(nextState);
    if (!nextState.isError) {
      results.push(nextState.result);
    } else {
      done = true;
    }
  }

  if (results.length === 0) return updateParserError(
      parserState,
      `many1: Unable to match any input using parser @ index ${parserState.index}`
    );

  return updateParserResult(nextState, results);
});

const sepBy = seperateParser => valueParser => new Parser(parserState => {
  if (parserState.isError) return parserState;
  const results = [];
  let nextState = parserState;

  while(true) {
    ++count
    const thinkWeWantState = valueParser.parserStateTransformerFn(nextState);
    if (thinkWeWantState.isError) break;
    results.push(thinkWeWantState.result);
    nextState = thinkWeWantState;
    
    const separatorState = seperateParser.parserStateTransformerFn(nextState);
    if (separatorState.isError) break;
    nextState = separatorState;
  }
  return updateParserResult(nextState, results);
});

const sepBy1 = seperateParser => valueParser => new Parser(parserState => {
  const results = [];
  let nextState = parserState;

  while(true) {
    const thinkWeWantState = valueParser.parserStateTransformerFn(nextState);
    if (thinkWeWantState.isError) break;
    results.push(thinkWeWantState);
    nextState = thinkWeWantState;
    
    const separatorState = seperateParser.parserStateTransformerFn(nextState);
    if (separatorState) break;
    nextState = separatorState;
  }
  if (results.length === 0) return updateParserError(
    parserState,
    `sepBy1: unableto capture any result at index ${parserState.index}`
  )
  return updateParserResult(nextState, results);
});

const between = (leftParser, rightParse) => contentParser => sequenceOf([
  leftParser, contentParser, rightParse
]).map((results) => results[1]);

const lazy = parserThunk => new Parser(parserState => {
  const parser = parserThunk();
  return parser.parserStateTransformerFn(parserState);
})


module.exports = {
  str,
  letters,
  digits,
  sequenceOf,
  choice,
  many,
  many1,
  sepBy,
  sepBy1,
  between,
  lazy,
};
