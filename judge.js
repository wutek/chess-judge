async function main() {
    console.log('main()')

    const url1 = document.getElementById('endpoint1').value
    const url2 = document.getElementById('endpoint2').value
    const startingTime = Number(document.getElementById('clock').value)

    console.log(url1, url2, startingTime)

    let clock1 = startingTime
    let clock2 = startingTime
    let start = 0
    let end = 0

    let FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // starting position
    let move = ''

    while (noCheckmate(FEN)) {
        start = (new Date()).getTime()
        move = getMoveFromEndpoint(url1, FEN)
        end = (new Date()).getTime()

        console.log('Move length player1: ' + end - start)

        moveOnBoard(FEN, move)

        await sleep(2000)

        start = (new Date()).getTime()
        move = getMoveFromEndpoint(url2, FEN)
        end = (new Date()).getTime()

        console.log('Move length player2: ' + end - start)

        moveOnBoard(FEN, move)

        await sleep(2000)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getMoveFromEndpoint(url) {
    const response = fetch(url, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    })

    response.then((value) => console.log(value))

    return '3234'

    // console.log(response)
    
    // return response; // parses JSON response into native JavaScript objects
}

function FENtoBoard(FEN) {
    return FEN
            .split(' ')[0]
            .split('/')
            .map(row => row.replace(/\d/g, el => ' '.repeat(Number(el)) ))
            .map(row => row.split(''))
}

function BoardToFEN(board) {
    return board
            .map(row => row.join(''))
            .map(row => row.replace(/( {1,8})/g, el => el.length))
            .join('/')
}

function moveOnBoard(FEN, move) {
    console.assert(move.match(/[1-8]{4}[1-4]?/), 'invalid move format')
    // rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
    // console.assert(FEN.match(/([rnbqkbnrpPRNBQKBNR1-8 ]{1,8}\/){7}[rnbqkbnrpPRNBQKBNR1-8 ] [wb] -?K?Q?k?q? [a-h]?[1-8]?-? \d{1,2} \d{1,3}/))

    const board = FENtoBoard(FEN)
    
    const start = [Number(move[0]), Number(move[1])]
    const end = [Number(move[2]), Number(move[3])]
    const piece = board[8 - start[1]][start[0] - 1]

    board[8 - start[1]][start[0] - 1] = ' '
    board[8 - end[1]][end[0] - 1] = piece

    return BoardToFEN(board)
}

function renderFEN(FEN) {
    const board = FENtoBoard(FEN)

    for (let row = 0; row < 8; row++)
        for (let column = 0; column < 8; column++)
            document.getElementById(getId(row, column)).className = pieceClassName(board[row][column])
}

function pieceClassName(piece) {
    switch (piece) {
        case 'r': return 'ROOK_BLACK'
        case 'n': return 'KNIGHT_BLACK'
        case 'b': return 'BISHOP_BLACK'
        case 'k': return 'KING_BLACK'
        case 'q': return 'QUEEN_BLACK'
        case 'p': return 'PAWN_BLACK'
        case 'R': return 'ROOK_WHITE'
        case 'N': return 'KNIGHT_WHITE'
        case 'B': return 'BISHOP_WHITE'
        case 'K': return 'KING_WHITE'
        case 'Q': return 'QUEEN_WHITE'
        case 'P': return 'PAWN_WHITE'
    }
}

function getId(row, column) {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    return columns[column] + (8 - row)
}

function noCheckmate(FEN) {
    return true
}

let FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // starting position
FEN = moveOnBoard(FEN, '2133')
renderFEN(FEN)
