let notas = [7, 4, 9, 3, 8, 5, 10]

for(let i = 0; i < notas.length; i++){
     if(notas[i] >= 6){
         console.log(`aprovado ${notas[i]}`)
     } else{
         console.log(`Reprovado ${notas[i]}`)
     }
}