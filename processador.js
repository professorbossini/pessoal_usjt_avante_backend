const csv = require('fast-csv')
const fs = require('fs')
const _ = require('underscore')
const sortArray = require('sort-array')
const moment = require('moment')


const obterBaseInteiraPorData = () => {
    return new Promise ((resolve, reject) => {
        const avtCoinsPorPresenca = 15
        let alunos = []
        try{
            fs.createReadStream("presencas.csv")
                .pipe(csv.parse({ headers: true }))
                .on('data', (linha) => {
                    try{
                        const date = new Date(linha['Carimbo de data/hora'])
                        const diaDaSemana = date.getDay()
                        if (diaDaSemana === 3) {
                            const data = date.toLocaleDateString('pt-BR')
                            const aluno = {
                                nome: linha["Nome completo, sem abreviações"],
                                ra: linha["RA"],
                                avtCoins: avtCoinsPorPresenca,
                                dataPresenca: data
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
                    }
                    catch (e){
                        console.log(e)
                    }
                })
                .on('end', (totalLinhas) => {
                    resolve(alunos)
            })
        }
        catch (e){
            console.log(e)
        }
    })

}

const consolidatedAvtCoins = () => {
    return new Promise ((resolve, reject) => {
            obterBaseInteiraPorData()
            .then(async dados => {
                let alunosConsolidados = []
                //pontos por presenças em aula
                for (objeto of dados) {
                        for (aluno of objeto.alunos) {
                            const alunoConsolidado = alunosConsolidados.find((a) => a.ra === aluno.ra)
                            if (alunoConsolidado) {
                                alunoConsolidado.avtCoins += aluno.avtCoins
                                alunoConsolidado['historico']['Presenças (15 avtcoins por presença)'] += aluno.avtCoins
                                alunoConsolidado['historico']['Datas em que esteve presente'].push(objeto.data)
                            }
                            else {
                                alunosConsolidados.push(
                                    { 
                                        nome: aluno.nome, 
                                        ra: aluno.ra, 
                                        avtCoins: aluno.avtCoins ,
                                        historico: {
                                            'Presenças (15 avtcoins por presença)': aluno.avtCoins,
                                            'Datas em que esteve presente': [objeto.data]
                                        },
                                       
                                    }
                                )
                            }
                        }
                    }
                    

                    // }
                //avaliacoes
                const avaliacoes = ['avaliacao_listas', 'avaliacao_questoes_gerais']
                for (avaliacao of avaliacoes){
                    const notasDeAvaliacao = await obterPontuacaoDaAvalicao(avaliacao)
                    for (notaDeAvaliacao of notasDeAvaliacao){
                        
                        for (alunoConsolidado of alunosConsolidados){
                            if (!alunoConsolidado['historico']['Avaliações (Listas ligadas e questões gerais (50 avtcoins por avaliação))'])
                                alunoConsolidado['historico']['Avaliações (Listas ligadas e questões gerais (50 avtcoins por avaliação))'] = 0
                            if (+alunoConsolidado.ra === +notaDeAvaliacao.ra){
                                alunoConsolidado.avtCoins += +notaDeAvaliacao.pontuacao
                                alunoConsolidado['historico']['Avaliações (Listas ligadas e questões gerais (50 avtcoins por avaliação))'] += +notaDeAvaliacao.pontuacao
                            }
                            // if (alunoConsolidado.ra == 818136575)
                            //     console.log(`${avaliacao}: ${alunoConsolidado.avtCoins}`)
                            
                        }
                    }
                }
               
                //desafios
                const desafiosCollection = await calcularPontuacaoDeTodosOsDesafios()
                // console.log(desafiosCollection)
                for (desafios of desafiosCollection){
                    for (desafio of desafios){
                        for (alunoConsolidado of alunosConsolidados){
                            if (!alunoConsolidado['historico']['Desafios (Tópico Desafios - Obtenha AVANTE COINS no Classroom)'])
                            alunoConsolidado['historico']['Desafios (Tópico Desafios - Obtenha AVANTE COINS no Classroom)'] = 0
                            // console.log (+alunoConsolidado.ra + ' ' + desafio.ra)
                            if (+alunoConsolidado.ra === +desafio.ra){
                                alunoConsolidado.avtCoins += +desafio.pontuacao
                                alunoConsolidado['historico']['Desafios (Tópico Desafios - Obtenha AVANTE COINS no Classroom)'] += +desafio.pontuacao
                            }
                            // if (alunoConsolidado.ra == 818136575)
                            //     console.log(`${JSON.stringify(desafio)}: ${alunoConsolidado.avtCoins}`)
                        }
                    }
                }
                //questionarios (só tem um por enquanto)
                // console.log ('aqui')
                const pontuacoesQuestionario = await calcularPontuacaoDeUmQuestionario()
                for (alunoConsolidado  of alunosConsolidados){
                    for (pontuacaoQuestionario of pontuacoesQuestionario){
                        if (!alunoConsolidado['historico']['Questionário (50 avtcoins)'])
                        alunoConsolidado['historico']['Questionário (50 avtcoins)'] = 0
                        if (+alunoConsolidado.ra === +pontuacaoQuestionario.ra){
                            alunoConsolidado.avtCoins += +pontuacaoQuestionario.pontuacao
                            alunoConsolidado['historico']['Questionário (50 avtcoins)'] += +pontuacaoQuestionario.pontuacao
                            // if (alunoConsolidado.ra == 818136575)
                            //     console.log(`${JSON.stringify(pontuacaoQuestionario)}: ${alunoConsolidado.avtCoins}`)
                        }
                        
                        // if (alunoConsolidado.ra == 818136575)
                        //     console.log(`${JSON.stringify(pontuacaoQuestionario)}: ${alunoConsolidado.avtCoins}`)
                    }
                }

                const pontuacoesPuzzles = await calcularPontuacaoDePuzzles()
                for (pontuacaoPuzzles of pontuacoesPuzzles){
                    for (alunoConsolidado  of alunosConsolidados){
                        if (!alunoConsolidado['historico']['Edpuzzles (30 avtcoins)'])
                        alunoConsolidado['historico']['Edpuzzles (30 avtcoins)'] = 0
                        if (+alunoConsolidado.ra === +pontuacaoPuzzles.ra){
                            alunoConsolidado.avtCoins += +pontuacaoPuzzles.pontuacao
                            alunoConsolidado['historico']['Edpuzzles (30 avtcoins)'] += +pontuacaoPuzzles.pontuacao
                            // if (alunoConsolidado.ra == 818136575)
                            //     console.log(`${JSON.stringify(pontuacaoQuestionario)}: ${alunoConsolidado.avtCoins}`)
                        }
                    }
                }

                const pontuacaoVideosEntregues = await calcularPontuacaoDeVideosEntregues()
                for (pontuacaoVideoEntregue of pontuacaoVideosEntregues){
                    for (alunoConsolidado  of alunosConsolidados){
                        if (!alunoConsolidado['historico']['Entrega do vídeo sobre o Avante (30 avtcoins)'])
                        alunoConsolidado['historico']['Entrega do vídeo sobre o Avante (30 avtcoins)'] = 0
                        if (+alunoConsolidado.ra === +pontuacaoVideoEntregue.ra){
                            alunoConsolidado.avtCoins += +pontuacaoVideoEntregue.pontuacao
                            alunoConsolidado['historico']['Entrega do vídeo sobre o Avante (30 avtcoins)'] += +pontuacaoVideoEntregue.pontuacao
                        }
                    }
                }

                const pontuacaoDeAlvosBlackboardEntregues = await calcularPontuacaoDeAlvosBlackboardEntregues()
                for (alunoConsolidado  of alunosConsolidados){
                    alunoConsolidado['historico']['Blackboard'] = 0
                    for (pontuacaoBlackboardEntregue of pontuacaoDeAlvosBlackboardEntregues){
                        if (+alunoConsolidado.ra === +pontuacaoBlackboardEntregue.ra){
                                if (pontuacaoBlackboardEntregue.alvos.length > 0){
                                    alunoConsolidado.avtCoins += pontuacaoBlackboardEntregue.alvos.reduce((ac, cur) => ac + cur.pontuacao, 0)
                                    alunoConsolidado['historico']['Blackboard'] = _.sortBy(pontuacaoBlackboardEntregue.alvos, 'alvo')
                                }
                            }
                    }
                    
                }

                const pontuacoesDeAtividadeQueSubstituiOBlackBoard = await calcularPontuacaoDeAtividadeQueSubstituiOBlackboard()
                for (alunoConsolidado of alunosConsolidados){
                    alunoConsolidado['historico']['Atividade que substitui o Blackboard'] = 0
                    for (pontuacaoDeAtividadeQueSubstituiOBlackBoard of pontuacoesDeAtividadeQueSubstituiOBlackBoard){
                        if (+alunoConsolidado.ra === +pontuacaoDeAtividadeQueSubstituiOBlackBoard.ra){
                            alunoConsolidado['historico']['Atividade que substitui o Blackboard'] = pontuacaoDeAtividadeQueSubstituiOBlackBoard
                            alunoConsolidado.avtCoins += pontuacaoDeAtividadeQueSubstituiOBlackBoard.pontuacao
                        }
                    }
                        
                }


                const pontuacoesSimuladosEnade = await calcularPontuacaoDeSimuladoEnade()
                for (alunoConsolidado  of alunosConsolidados){
                    for (pontuacaoSimuladoEnade of pontuacoesSimuladosEnade){
                        if (+alunoConsolidado.ra === +pontuacaoSimuladoEnade.ra){
                                if (alunoConsolidado['historico']['Blackboard'] === 0){
                                    alunoConsolidado['historico']['Blackboard'] = [{alvo: "Alvo 7", pontuacao: pontuacaoSimuladoEnade.pontuacao}]
                                    alunoConsolidado.avtCoins += 100
                                }
                                else{
                                    const existente = alunoConsolidado['historico']['Blackboard'].find(a => a.alvo === "Alvo 7")
                                    if (existente){
                                        existente.pontuacao = pontuacaoSimuladoEnade.pontuacao
                                        alunoConsolidado.avtCoins += 20
                                    }
                                }
                        }
                    }
                }

                //aqui decidimos se o aluno fica com a pontuacao de blackboard ou da atividade que o substitui
                for (alunoConsolidado of alunosConsolidados){
                    const totalBlackboard = 
                        alunoConsolidado['historico']['Blackboard'] ===  0 ? 0 : 
                            alunoConsolidado['historico']['Blackboard'].reduce((ac, atual) => ac + atual.pontuacao, 0)
                    const totalAtividadeSubstitutiva = 
                        alunoConsolidado['historico']['Atividade que substitui o Blackboard'] === 0 ? 0 : 
                        alunoConsolidado['historico']['Atividade que substitui o Blackboard'].pontuacao
                    alunoConsolidado['historico']['Usando Blackboard ou Substitutiva?'] = 
                        totalBlackboard >= totalAtividadeSubstitutiva ? "Blackboard" : "Substitutiva"
                    if ( alunoConsolidado['historico']['Usando Blackboard ou Substitutiva?'] === "Blackboard"){
                        alunoConsolidado.avtCoins -= totalAtividadeSubstitutiva
                    }
                    else{
                        alunoConsolidado.avtCoins -= totalBlackboard
                    }
                }   

                const pontuacoesCadernosEnade = await calcularPontuacaoDeEntregasdeCadernoEnade()
                for (alunoConsolidado  of alunosConsolidados){
                    alunoConsolidado['historico']['Entrega do Caderno Enade'] = 0
                    for (pontuacaoCadernoEnade of pontuacoesCadernosEnade){
                        if (+alunoConsolidado.ra === +pontuacaoCadernoEnade.ra){
                            alunoConsolidado.avtCoins += +pontuacaoCadernoEnade.pontuacao
                            alunoConsolidado['historico']['Entrega do Caderno Enade'] = pontuacaoCadernoEnade.pontuacao  
                        }
                    }
                }


                //ajusta a representação textual dos alvos para exibição pelo Bot
                for (alunoConsolidado  of alunosConsolidados){
                    if (alunoConsolidado['historico']['Blackboard'] !== 0){
                        alunoConsolidado['historico']['Blackboard'] = alunoConsolidado['historico']['Blackboard'].map(a => {
                            return `${a.alvo}: ${a.pontuacao}`.replace('"', '')
                        })
                    }
                }

                //ajusta a representação textual da ativividade substitutiva do blackboard para o Bot
                for (alunoConsolidado  of alunosConsolidados){
                    if (alunoConsolidado['historico']['Atividade que substitui o Blackboard'] !== 0){
                        alunoConsolidado['historico']['Atividade que substitui o Blackboard'] = alunoConsolidado['historico']['Atividade que substitui o Blackboard'].questoes.map(a => {
                            return `${a.questao}: ${a.resultado}`.replace('"', '')
                        })
                    }
                }
                
                //ordenando a lista de datas em que o aluno esteve presente
                for (alunoConsolidado of alunosConsolidados) {
                    alunoConsolidado['historico']['Datas em que esteve presente'] = alunoConsolidado['historico']['Datas em que esteve presente'].sort(
                            (d1, d2) => {
                                if (moment(d1, 'DD/MM/YYYY').isBefore(moment(d2, 'DD/MM/YYYY')))
                                    return 1
                                if (moment(d2, 'DD/MM/YYYY').isBefore(moment(d1, 'DD/MM/YYYY')))
                                    return -1
                                return 0
                            }
                        )
                }
                const RAsAssociadosACampi = await obtemRAAssociadoAoCampus()
                for (alunoConsolidado of alunosConsolidados) {
                    for (raAssociadoACampus of RAsAssociadosACampi) {
                        if (alunoConsolidado.ra === raAssociadoACampus.ra){
                            alunoConsolidado['campus'] = raAssociadoACampus.campus
                        }
                    }
                }
                //calculando percentual final
                for (alunoConsolidado of alunosConsolidados) {
                    alunoConsolidado['historico']['percentualFinal'] = `${Math.min(100, alunoConsolidado.avtCoins / 400 * 100).toLocaleString()}%`
                }
                resolve (alunosConsolidados)
            })
    
})}

const obtemRAAssociadoAoCampus = () => {
    return new Promise((resolve, reject) => {
        const nome_arquivo = 'base_alunos_ra_campus.csv'
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const existe = result.find (a => a.ra === linha['RA'])
            if (!existe){
                result.push({ra: linha['RA'], campus: linha['CAMPUS']})
            }
        })
        .on('end', () => resolve(result) )
    })
}

const calcularPontuacaoDeAtividadeQueSubstituiOBlackboard = () => {
    return new Promise ((resolve, reject) => {
        const nome_arquivo = "20212_usjt_avante_atividade_para_quem_nao_teve_blackboard.csv"
            let result = []
            fs.createReadStream(`${nome_arquivo}`)
            .pipe(csv.parse({headers: true}))
            .on('data', (linha) => {
                let existente = result.find( a => a.ra === linha['RA'])
                if (!existente) {
                    existente = {
                       ra: linha['RA'],
                       pontuacao: 
                        Math.min(((linha['Questão 9'] === linha['QGab9'] ? 1 : 0) * 35 +
                        (linha['Questão 10'] === linha['QGab10'] ? 1 : 0) * 35 +
                        (linha['Questão 11'] === linha['QGab11'] ? 1 : 0) * 35 +
                        (linha['Questão 12'] === linha['QGab12'] ? 1 : 0) * 35 +
                        (linha['Questão 13'] === linha['QGab13'] ? 1 : 0) * 35 +
                        (linha['Questão 14'] === linha['QGab14'] ? 1 : 0) * 35 +
                        (linha['Questão 15'] === linha['QGab15'] ? 1 : 0) * 35 +
                        (linha['Questão 16'] === linha['QGab16'] ? 1 : 0) * 35 +
                        (linha['Questão 17'] === linha['QGab17'] ? 1 : 0) * 35 +
                        (linha['Questão 18'] === linha['QGab18'] ? 1 : 0) * 35), 310),
                        questoes: [
                            {questao: 'Q9', resultado: linha['Questão 9'] === linha['QGab9'] ? '✅': '❌'},
                            {questao: 'Q10', resultado: linha['Questão 10'] === linha['QGab10'] ? '✅': '❌'},
                            {questao: 'Q11', resultado:  linha['Questão 11'] === linha['QGab11'] ? '✅': '❌'},
                            {questao: 'Q12', resultado:  linha['Questão 12'] === linha['QGab12'] ? '✅': '❌'},
                            {questao: 'Q13', resultado:  linha['Questão 13'] === linha['QGab13'] ? '✅': '❌'},
                            {questao: 'Q14', resultado:  linha['Questão 14'] === linha['QGab14'] ? '✅': '❌'},
                            {questao: 'Q15', resultado:  linha['Questão 15'] === linha['QGab15'] ? '✅': '❌'},
                            {questao: 'Q16', resultado:  linha['Questão 16'] === linha['QGab16'] ? '✅': '❌'},
                            {questao: 'Q17', resultado:  linha['Questão 17'] === linha['QGab17'] ? '✅': '❌'},
                            {questao: 'Q18', resultado:  linha['Questão 18'] === linha['QGab18'] ? '✅': '❌'},
                        ]
                    }
                    result.push(existente)                
                }
                
            })
            .on('end', () => {
                resolve(result)
            })
    })
}

const calcularNotasNoEnadeDeQuemEntregouOCaderno = () => {
    return new Promise((resolve, reject) => {
        const mapaDeNomesDeCursos = {
            SI: "Sistemas de Informação",
            CCP: "Ciência da Computação",
            ADS: "Análise e Desenvolvimento de Sistemas",
            GTI: "Gestão de Tecnologia da Informação"
        }
        const nome_arquivo = "enade_respostas_dos_alunos_na_prova.csv"
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            let existente = result.find( a => a.ra === linha['RA'])
            if (!existente) {
                existente = {
                    ra: linha['RA'], 
                    nome: linha['Nome'], 
                    curso: linha['Curso'],
                    campus: linha['CAMPUS']
                }
                result.push(existente)
                existente['mapa_questoes_respostas'] = []
                existente.totalAcertos = 0
            }
            existente['mapa_questoes_respostas'].push({
                questao: linha['Questão'],
                gabarito: linha['Gabarito'],
                respostaAluno: linha['Resposta'],
            })
            existente.totalAcertos += (linha['Gabarito'] === linha['Resposta'] ? 1: 0)
        })
        .on('end', () => {
            result.forEach(a => {
                //enade teve 35 questões objetivas
                a['percentual'] = (a.totalAcertos / 35).toPrecision(2)
            })
            resolve(_.sortBy(result, 'percentual').reverse())
        })
    })
}

const calcularPontuacaoDeEntregasdeCadernoEnade = () => {
    return new Promise((resolve, reject) => {
        const nome_arquivo = 'entregas_cadernos_30avtcoins.csv'
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const existe = result.find (a => a.ra === linha['RA'])
            if (!existe)
                result.push({ra: linha['RA'], pontuacao: 30})
        })
        .on('end', () => resolve(result) )
    })
}

const calcularPontuacaoDeSimuladoEnade = () => {
    return new Promise((resolve, reject) => {
        const nome_arquivo = 'entrega_simulado_enade.csv'
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const existe = result.find (a => a.ra === linha['RA'])
            if (!existe)
                result.push({ra: linha['RA'], pontuacao: 100})
        })
        .on('end', () => resolve(result) )
    })
}

const calcularPontuacaoDeAlvosBlackboardEntregues = () => {
    return new Promise((resolve, reject) => {
        const pontuacaoPorAlvo = 30
        const pontuacaoExtraAlvo7 = 50
        const nome_arquivo = 'entregas_blackboard.csv'
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const alvoDaVez = linha['A qual alvo esta entrega se refere?']
            const pontuacao = alvoDaVez === 'Alvo 7' ? pontuacaoPorAlvo + pontuacaoExtraAlvo7 : pontuacaoPorAlvo
            const alunoExistente = result.find (a => a.ra === linha['RA'])
            if (alunoExistente) {
                const jaPontuou = alunoExistente.alvos.find(a => a.alvo === alvoDaVez)
                if (!jaPontuou){
                   alunoExistente.alvos.push({alvo: alvoDaVez, pontuacao: pontuacao})
                }
            }
            else{
                result.push({ra: linha['RA'], alvos: [{alvo: alvoDaVez, pontuacao: pontuacao}]})
            }
        })
        .on('end', () => {resolve(result)} )
    })
}

const calcularPontuacaoDeVideosEntregues = () => {
    return new Promise((resolve, reject) => {
        const nome_arquivo = 'entrega_videos_30_avtcoins.csv'
        let result = []
        fs.createReadStream(`${nome_arquivo}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            result.push({ra: linha['RA'], pontuacao: 30})
        })
        .on('end', () => resolve(result) )
    })
}

const calcularPontuacaoDeTodosOsDesafios = () => {
    return new Promise ((resolve, reject) => {
        const desafios = [
            {
                nome: 'desafio_01.csv',
                pontuacao: 10
            },
            {
                nome: 'desafio_02.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_03.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_06.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_07.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_08.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_09.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_10.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_11.csv',
                pontuacao: 5
            },
            {
                nome: 'desafio_04.csv',
                pontuacao: 8
            }
        ]
        let promises = []
        desafios.forEach(desafio => {
            promises.push(calcularPontuacaoDeUmDesafio(desafio))
        })
        Promise.all(promises).then((result) => resolve(result))
    })

}

const calcularPontuacaoDeUmDesafio  = (desafio) => {
    return new Promise ((resolve, reject) => {
        let result = []
        fs.createReadStream(`${desafio.nome}`)
        .pipe(csv.parse({headers: true}))
        .on('data', (linha) => {
            const existe = result.find(a => a.ra === linha['RA:'])
            if (!existe)
                result.push({ra: linha['RA:'], pontuacao: desafio.pontuacao})
        })
        .on('end', () => resolve(result) )
    })
}

const obterDataDaBase = (callback) => {
    const dataPresencas = fs.statSync('presencas.csv').ctime
    const dataAvaliacoes = fs.statSync('avaliacao_listas.csv')?.mtime
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
        .on ('end', (rowNumber) => {
            resolve(alunos)
        })
    })
}

const calcularPontuacaoDeUmQuestionario = () =>{
    return new Promise ((resolve, reject) => {
        let pontuacao = []
        const nomeQuestionario = 'questionario_50avtcoins.csv'
        fs.createReadStream(nomeQuestionario)
        .pipe(csv.parse({headers:true}))
        .on('data', linha => {
            const existing = pontuacao.some(p => p.ra === linha['RA:'])
            if (!existing)
                pontuacao.push({ra: linha['RA:'], pontuacao: 50})
        })
        .on('end', rowNumber => {
            resolve(pontuacao)
        })
    })
}

const calcularPontuacaoDePuzzles = () => {
    return new Promise ((resolve, reject) => {
        const nomeArquivoPuzzles = 'puzzles_avt_coins.csv'
        let pontuacao = []
        fs.createReadStream(nomeArquivoPuzzles)
        .pipe(csv.parse({headers:true}))
        .on('data', linha => {
            const existing = pontuacao.some(p => p.ra === linha['RA'])
            if (!existing)
                pontuacao.push({ra: linha['RA'], pontuacao: linha['Avte coins']})
        })
        .on('end', rowNumber => {
            resolve(pontuacao)
        })
    })
}


module.exports = {
    consolidatedAvtCoins, 
    obterBaseInteiraPorData, 
    obterDataDaBase, 
    obterPontuacaoDaAvalicao,
    calcularNotasNoEnadeDeQuemEntregouOCaderno
}
