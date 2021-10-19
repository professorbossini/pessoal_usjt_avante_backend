const processador = require('./processador')
const titleCase = require('title-case')
const _ = require('underscore')
const cors = require('cors')
const express = require('express')
const app = express()
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send("Hey, this is Avante! USJT")
})


app.get('/myself_among_others', (req, res) => {

    processador.consolidatedAvtCoins()
    .then (consolidatedAvtCoins => {
            consolidatedAvtCoins = _.sortBy (consolidatedAvtCoins, (o) => o.nome)
            consolidatedAvtCoins = consolidatedAvtCoins.reverse()
            consolidatedAvtCoins = _.sortBy (consolidatedAvtCoins, o => o.avtCoins)
            consolidatedAvtCoins = consolidatedAvtCoins.reverse()
            const posicaoDoAluno = _.findIndex(consolidatedAvtCoins, (a) => a.ra === req.query.ra)
            let indexOfUpLimit = posicaoDoAluno <= 5 ? 0 : posicaoDoAluno - 5
            let indexOfBottomLimit = posicaoDoAluno >= consolidatedAvtCoins.length - 4 ? consolidatedAvtCoins.length - 1 : posicaoDoAluno + (10 - (posicaoDoAluno - indexOfUpLimit))
            console.log(indexOfUpLimit)
            console.log(posicaoDoAluno)
            console.log(indexOfBottomLimit)
            const thePositions = _.range(indexOfUpLimit, indexOfBottomLimit)
            const upPortion = consolidatedAvtCoins.slice(indexOfUpLimit, posicaoDoAluno)
            const BottomPortion = consolidatedAvtCoins.slice(posicaoDoAluno, indexOfBottomLimit)
            theFinalWindow = [...upPortion, ...BottomPortion].map((e, i) => ({posicao: thePositions[i] + 1, ...e}))
            console.log(theFinalWindow)
           res.send(theFinalWindow)
    })
})

app.get('/top_ones', (req, res) => {
    processador.consolidatedAvtCoins()
    .then (consolidatedAvtCoins => {
        consolidatedAvtCoins = consolidatedAvtCoins.map(a => ({ra: a.ra, nome: titleCase.titleCase(a.nome.toString().toLowerCase()), avtCoins: a.avtCoins}))
        consolidatedAvtCoins = _.sortBy (consolidatedAvtCoins, (o) => o.nome)
        consolidatedAvtCoins = consolidatedAvtCoins.reverse()
        consolidatedAvtCoins = _.sortBy (consolidatedAvtCoins, (o) => o.avtCoins)
        consolidatedAvtCoins = consolidatedAvtCoins.reverse()
        res.send(consolidatedAvtCoins.slice(0, +req?.query?.n || 10))
    })
})

app.get("/student_status", (req, res) => {
    console.log("Chegou aqui")
    processador.obterBaseInteiraPorData()
    .then(baseInteiraPorData => {
        let alunoResultado = { nome: '', ra: 0, avtCoins: 0 }
            for (let item of baseInteiraPorData) {
                for (let aluno of item.alunos) {
                    if (req.query.ra == aluno.ra) {
                        alunoResultado.nome = titleCase.titleCase(aluno.nome.toString().toLowerCase())
                        alunoResultado.ra = aluno.ra
                        alunoResultado.avtCoins += +aluno.avtCoins
                    }
                }
            }
        res.status(alunoResultado)
    })
})

app.get('/date_of_database', (req, res) => {
    const getDados = (dados) => {
        res.send(dados)
    }
    processador.obterDataDaBase(getDados)
})
app.listen(process.env.PORT || 3000)

