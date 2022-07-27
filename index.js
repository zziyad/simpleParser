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
}