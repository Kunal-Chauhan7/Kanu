'use strict';
/*
    This is a compiler made using JavaScript and with love too 
    developed By Kunal Chuahan
     _._     _,-'""`-._
    (,-.`._,'(       |\`-/|
        `-.-' \ )-`( , o o)                 here have a cat
              `-    \`_`"'-
*/

/*
    So compilers work like:
    1) Parsing: Take the code user has provided and abstract the representational code
    2) Transformation: Transform the abstracted representational code as needed
    3) Code generation: Convert the transformed representation into new code
*/

// The code below is the code for the tokenizer
function tokenizer(input) {
    let current = 0; //this will point to the current postion of the code more like where are we right now in the raw code or point to the current token
    let tokens = []; //this is where we will add out token which we read from the raw code
    
    while (current < input.length) { // so now we will start readign the input and add them to our tokens
        let char = input[current]; // reading the getting the current value of the token

        if (char === '(') { // so if we encounter a parenthesis so will add that to the token
            tokens.push({
                type: 'paren', // what kind of token it is
                value: '(', // what is the valeu of the token that got added
            });
            current++; // move to reading the next token
            continue;
        }

        if (char === ')') {  // same for the closing parenthesis
            tokens.push({
                type: 'paren',
                value: ')',
            });
            current++;
            continue;
        }
        // so if our input contains a whitespace so we do not really need to deal with the whitespace so we are going to skip the shitespace and extract the
        // the tokens from the input
        let WHITESPACE = /\s/; // this here is a specified pattern which is just the white space in javascript
        if (WHITESPACE.test(char)) { //.test() method is used to search a string for a specified pattern (RE) and returns true or false depending on whether the pattern is found or not.
            current++;
            continue;
        }

        // now we will deal with the numbers

        let NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) { // checking if 
            let value = ''; // an empty String which will contain the Numbers 
            while (NUMBERS.test(char)) { // while the current char is a number we will store that number inside    value
                value += char;
                char = input[++current];
            }
            tokens.push({
                type: 'number', // when the current char no longer is a number we push the value in the tokens 
                value
            });
            continue;
        }

        // Now let's start dealing with the strings 

        if (char === '"') { // so here we are dealing with the string " starting so to store this we will create a var that will store the value of the string so this means that a string is starting
            let value = '';
            char = input[++current]; // Skip the opening quote
            while (char !== '"') { // this loop will run untill the char " is not encountred or we can say a string is about to end
                value += char;
                char = input[++current]; // Read the next character
            }
            current++; /// this loop will exit when " is encounterd means the closing part so we are going to skip that as well
            tokens.push({
                type: 'string',
                value
            });
            continue;
        }

        let LETTERS = /[a-z]/i; // handling the alphabets now from a to z
        if (LETTERS.test(char)) { // if the current char read by the current pointer is in the LETTERS then
            let value = '';
            while (LETTERS.test(char)) {
                value += char; // adding the value of char in current value
                char = input[++current];
            }
            tokens.push({
                type: 'name', // pushing the tokens created into the tokens 
                value
            });
            continue;
        }

        throw new TypeError("The character you have entered is not supported: " + char);
    }
    
    return tokens;
}

// HERE I have created a the parcer
// so parser takes in the input and then convert into AST to know more about ast here is the link
//https://en.wikipedia.org/wiki/Abstract_syntax_tree#:~:text=An%20abstract%20syntax%20tree%20(AST,construct%20occurring%20in%20the%20text.
// so the parser will take the tokens and then convert them into the AST

function parser(tokens) {
    let current = 0; // this will act as our cursor

    function walk() {
        let token = tokens[current]; // token which will have the current token value

        if (token.type === 'number') { // so if the token type is a number we will return a AST node which will be of type NumberLiteral 
            current++;
            return {
                type: 'NumberLiteral',
                value: token.value,
            };
        }

        if (token.type === 'string') {
            current++;
            return {
                type: 'StringLiteral',
                value: token.value,
            };
        }

        if (token.type === 'paren' && token.value === '(') { // In ast we do not care about the parenthesis
            token = tokens[++current];
            
            let node = { //creating a base node and setting the name of the node as the token value cause the next token will be the name of the function right after the open parenthsis
                type: 'CallExpression',
                name: token.value,
                params: [],
            };

            token = tokens[++current]; // skiping the name token and moving to the next token

            while (token.type !== 'paren' || (token.type === 'paren' && token.value !== ')')) { // loop untill we get a value of ) or we encounter a paren
                node.params.push(walk()); // push each node into the node params
                token = tokens[current];
            }

            current++;
            return node;
        }

        throw new TypeError("Unknown token type: " + token.type); // if any token is not recognized then throw a new error
    }

    let ast = {
        type: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        ast.body.push(walk());  //travese all the tokens and push those tokens into the ast body
    }

    return ast; // return the ast 
}

function traverser(ast, visitor) {
    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {
        let methods = visitor[node.type];

        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        switch (node.type) {
            case 'Program':
                traverseArray(node.body, node);
                break;
            case 'CallExpression':
                traverseArray(node.params, node);
                break;
            case 'NumberLiteral':
            case 'StringLiteral':
                break;
            default:
                throw new TypeError("Unknown node type: " + node.type);
        }

        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    traverseNode(ast, null); 
}

function transformer(ast) {
    /*
    so now right here we will make a new ast which will be the transformed ast
    */
    let newAst = {
        type: 'Program',
        body: [],
    };

    ast._context = newAst.body;
    
    // so now we will traverse the ast and start transforming the ast 

    traverser(ast, {
        NumberLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value,
                });
            },
        },
        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value,
                });
            },
        },
        CallExpression: {
            enter(node, parent) {
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name,
                    },
                    arguments: [],
                };

                node._context = expression.arguments;

                if (parent.type !== 'CallExpression') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression,
                    };
                }

                parent._context.push(expression);
            },
        }
    });

    return newAst;
}

function codeGenerator(node) {
    switch (node.type) { // so we will check the type of the node and then generate the code
        case 'Program':
            // If we have a `Program` node. We will map through each node in the `body`
            // and run them through the code generator and join them with a newline.
            return node.body.map(codeGenerator).join('\n');
            
        case 'ExpressionStatement':
            return codeGenerator(node.expression) + ';';
            
        case 'CallExpression':
            return (
                codeGenerator(node.callee) +
                '(' +
                node.arguments.map(codeGenerator).join(', ') +
                ')'
            );
            
        case 'Identifier':
            return node.name;
            
        case 'NumberLiteral':
            return node.value;
            
        case 'StringLiteral':
            return '"' + node.value + '"';
            
        default:
            throw new TypeError("Unknown node type: " + node.type);
    }
}

function compiler(input) {
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(newAst);
    return output;
}

// Export all functions for testing and usage
module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    codeGenerator,
    compiler,
};