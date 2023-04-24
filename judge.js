async function main() {
    const url1 = document.getElementById('endpoint1').value
    const url2 = document.getElementById('endpoint2').value
    const clockWhite = document.getElementById('time-white')
    const clockBlack = document.getElementById('time-black')

    let clock1 = 0
    let clock2 = 0
    let start = 0
    let end = 0

    let FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // starting position
    let move = ''

    while (noCheckmate(FEN)) {
        start = (new Date()).getTime()
        move = await getMoveFromEndpoint(url1, FEN)
        end = (new Date()).getTime()

        console.log('Move length player1: ' + (end - start) + ' move: ' + move)
        clock1 += (end - start)
        clockWhite.value = msToClock(clock1)

        FEN = moveOnBoard(FEN, move)
        renderFEN(FEN)

        await sleep(100)

        start = (new Date()).getTime()
        move = await getMoveFromEndpoint(url2, FEN)
        end = (new Date()).getTime()

        console.log('Move length player2: ' + (end - start) + ' move: ' + move)
        clock2 += (end - start)
        clockBlack.value = msToClock(clock2)

        FEN = moveOnBoard(FEN, move)
        renderFEN(FEN)

        await sleep(100)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMoveFromEndpoint(url, data) {
    const response = await fetch(url + '?fen=' + encodeURIComponent(data),
        {
            method: "GET", // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, *cors, same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow", // manual, *follow, error
            referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        }
    )

    return await response.text()
}

function oppositeColor(color) {
    console.assert(color === 'w' || color === 'b')

    return color === 'w' ? 'b' : 'w'
}

function FENtoBoard(FEN) {
    return FEN
            .split(' ')[0]
            .split('/')
            .map(row => row.replace(/\d/g, el => ' '.repeat(Number(el))))
            .map(row => row.split(''))
}

function BoardToFEN(board) {
    return board
            .map(row => row.join(''))
            .map(row => row.replace(/( {1,8})/g, el => el.length))
            .join('/')
}

function moveOnBoard(FEN, move) {
    if (typeof move !== 'string') {
        throw new Error('move is not a string')
    }
    
    if (!move.match(/^[1-8]{4}[1-4]?$/)) {
        throw new Error('invalid move format')
    }
    
    // console.assert(FEN.match(/^[rnbqkbnrpPRNBQKBNR1-8 /]* [wb] -?K?Q?k?q? [a-h]?[1-8]?-? \d{1,2} \d{1,3}$/), 'Invalid FEN')

    const splitFen = FEN.split(' ')

    if (splitFen.length !== 6) {
        throw new Error('Invalid fen.')
    }

    const board = FENtoBoard(FEN)
    const color = splitFen[1]
    const availableCastle = splitFen[2]
    const enPassant = splitFen[3]
    let halfMoves = splitFen[4]
    let moveNumber = splitFen[5]
    
    const start = [8 - Number(move[1]), Number(move[0]) - 1]
    const end = [8 - Number(move[3]), Number(move[2]) - 1]
    const piece = board[start[0]][start[1]]

    if (color === 'w' && !['P', 'R', 'B', 'K', 'N', 'Q'].includes(piece)) {
        throw new Error('White move invalid, Trying to move from field where there is no white piece.')
    }

    if (color === 'b' && !['p', 'r', 'b', 'k', 'n', 'q'].includes(piece)) {
        throw new Error('Black move invalid, Trying to move from field where there is no black piece.')
    }

    // validate move
    console.log(board[start[0]][start[1]], board[end[0]][end[1]])


    // apply move
    board[start[0]][start[1]] = ' '
    board[end[0]][end[1]] = piece

    // promotion
    if (piece === 'p' && end[0] === 7) {
        if (move.length !== 5) {
            throw new Error('Missing information about promotion.')
        }

        switch (move[4]) {
            case '1': board[end[0]][end[1]] = 'q'; break
            case '2': board[end[0]][end[1]] = 'r'; break
            case '3': board[end[0]][end[1]] = 'b'; break
            case '4': board[end[0]][end[1]] = 'n'; break
        }
    }

    if (piece === 'P' && end[0] === 0) {
        if (move.length !== 5) {
            throw new Error('Missing information about promotion.')
        }

        switch (move[4]) {
            case '1': board[end[0]][end[1]] = 'Q'; break
            case '2': board[end[0]][end[1]] = 'R'; break
            case '3': board[end[0]][end[1]] = 'B'; break
            case '4': board[end[0]][end[1]] = 'N'; break
        }
    }

    // black castle
    if (piece === 'k' && start[0] === 0 && start[1] === 4) {
        // short
        if (end[0] === 0 && end[1] === 6) {
            if (board[0][7] !== 'r') {
                throw new Error('Black short castle error. No rook on starting position.')
            }
            board[0][5] = 'r'
            board[0][7] = ' '
        }

        // long
        if (end[0] === 0 && end[1] === 2) {
            if (board[0][0] !== 'r') {
                throw new Error('Black long castle error. No rook on starting position.')
            }
            board[0][3] = 'r'
            board[0][0] = ' '
        }
    }

    // white castle
    if (piece === 'K' && start[0] === 7 && start[1] === 4) {
        // short
        if (end[0] === 7 && end[1] === 6) {
            if (board[7][7] !== 'r') {
                throw new Error('White short castle error. No rook on starting position.')
            }
            board[7][5] = 'r'
            board[7][7] = ' '
        }

        // long
        if (end[0] === 7 && end[1] === 2) {
            if (board[7][0] !== 'r') {
                throw new Error('Black long castle error. No rook on starting position.')
            }
            board[7][3] = 'r'
            board[7][0] = ' '
        }
    }

    // en passant
    if (piece === 'p' && start[0] === 4 && start[1] !== end[1] && board[end[0]][end[1]] === ' ') {
        if (isFieldEnPassant(fen, end)) {
            throw new Error('En passant error. En passant field not in fen.')
        }

        board[4][end[1]] = ' '
    }

    // TODO: remove castle possibilities

    // TODO: en passant

    // check if its needed to reset halfmove counter
    if (piece === 'p' || piece === 'P' || board[end[0]][end[1]] !== ' ') {
        halfMoves = 0
    } else {
        halfMoves = Number(halfMoves) + 1
    }

    // increase move number
    if (color === 'b') {
        moveNumber = Number(moveNumber) + 1
    }

    let fen = [
        BoardToFEN(board),
        oppositeColor(color),
        availableCastle,
        enPassant,
        String(halfMoves),
        String(moveNumber)
    ]

    return fen.join(' ')
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

function msToClock(ms) {
    const sec = String(Math.floor(ms / 1000 % 60))
    const min = String(Math.floor(ms / 1000 / 60))
    const miliseconds = String(Math.floor(ms % 1000))

    return min.padStart(2, '0') + ':' + sec.padStart(2, '0') + ":" + miliseconds.padStart(3, '0')
}

let FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // starting position
renderFEN(FEN)
