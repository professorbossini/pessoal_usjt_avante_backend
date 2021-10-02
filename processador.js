csv = require('fast-csv')
fs = require('fs')
_ = require('underscore')

const obterBaseInteiraPorData = () => {
    return new Promise ((resolve, reject) => {
        const avtCoinsPorPresenca = 15
        let alunos = []
        fs.createReadStream("presencas.csv")
            .pipe(csv.parse({ headers: true }))
            .on('data', (linha) => {
                const date = new Date(linha['Carimbo de data/hora'])
                const diaDaSemana = date.getDay()
                if (diaDaSemana === 3) {
                    const data = date.toLocaleDateString()
                    const aluno = {
                        nome: linha["Nome completo, sem abreviações"],
                        ra: linha["RA"],
                        avtCoins: avtCoinsPorPresenca
                    }
                    const item = alunos.find((elemento) => elemento.data === data)
                    if (!item) {
                        alunos.push({ data: data, alunos: [aluno] })
                    } else {
                        const indice = item.alunos.findIndex(a => a.ra === aluno.ra)
                        if (indice < 0)
                            item.alunos.push(aluno)
                    }
                }
            })
            .on('end', (totalLinhas) => {
                resolve(alunos)
            })
    })

}

const consolidatedAvtCoins = () => {
    return new Promise ((resolve, reject) => {
            obterBaseInteiraPorData()
            .then(dados => {
                let alunosConsolidados = []
                for (objeto of dados) {
                        for (aluno of objeto.alunos) {
                            const alunoConsolidado = alunosConsolidados.find((a) => a.ra === aluno.ra)
                            if (alunoConsolidado) {
                                alunoConsolidado.avtCoins += aluno.avtCoins
                            }
                            else {
                                alunosConsolidados.push({ nome: aluno.nome, ra: aluno.ra, avtCoins: aluno.avtCoins })
                            }
                        }
                }
                const avaliacoes = ['avaliacao_listas']
                for (avaliacao of avaliacoes){
                    console.log(avaliacao)
                    obterPontuacaoDaAvalicao(avaliacao).then(notasDeAvaliacao => {
                        for (notaDeAvaliacao of notasDeAvaliacao){
                            console.log(notaDeAvaliacao)
                            for (alunoConsolidado of alunosConsolidados){
                                if (+alunoConsolidado.ra === +notasDeAvaliacao.ra){
                                    console.log ('entrou')
                                    alunoConsolidado.avtCoins += notasDeAvaliacao.pontuacao
                                }
                            }
                        }
                    })
                }
                resolve (alunosConsolidados)
            })
    
})}

const obterDataDaBase = (callback) => {
    const dataPresencas = fs.statSync('presencas.csv')?.mtime
    const dataAvaliacoes = fs.statSync('avaliacoes.csv')?.mtime
    callback({
        dataPresencas, dataAvaliacoes
    })
}

const obterPontuacaoDaAvalicao = (avaliacao) => {
    return new Promise ((resolve, reject) => {
        let alunos = []
        fs.createReadStream(`${avaliacao}.csv`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const pontuacao = Math.min(Number(linha['Pontuação'].split(' ')[0]) * 25, 50)
            const ra = Number(linha['Seu RA.'])
            const alunoExistente = alunos.find(a => a.ra === ra)
            if (alunoExistente){
                alunoExistente.pontuacao = Math.max (alunoExistente.pontuacao, pontuacao)
            }
            else{
                alunos.push({
                    ra, pontuacao
                })
            }
        })
        .on ('end', resolve(alunos))
    })
}


module.exports = {consolidatedAvtCoins, obterBaseInteiraPorData, obterDataDaBase, obterPontuacaoDaAvalicao}
