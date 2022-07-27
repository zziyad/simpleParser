const updateParserResult = (state, result) => ({
  ...state, result 
 });
const updateParserState = (state, index, result) => ({ 
 ...state, index, result 
});
const updateParserError = (state, errorMsg) => ({ 
 ...state, isError: true, error: errorMsg 
});