let arr =  [   
    {     
        id: 1,
        name: "pedro"
    },
    {     
        id: 2,     
        name: "lucas"   },   
    {   id: 3,
        name: "martin"   } ];
        

arr.find(x => x.id == 2).name = "Marcos";
console.log(arr.find(x => x.id == 2).name);
