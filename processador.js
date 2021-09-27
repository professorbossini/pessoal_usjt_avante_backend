csv = require('fast-csv')
fs = require('fs')
_ = require('underscore')

const obterBaseInteiraPorData = (getDados) => {
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
            getDados(alunos)
        })

}

const consolidatedAvtCoins = (callback) => {
    const doIt = () => {
        const getDados = (dados) => {
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
            callback(alunosConsolidados)
        }
        obterBaseInteiraPorData(getDados)
    }
    doIt()
}



module.exports = {consolidatedAvtCoins, obterBaseInteiraPorData}
