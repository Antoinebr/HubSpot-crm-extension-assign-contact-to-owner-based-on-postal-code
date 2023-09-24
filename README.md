# Assign contact to owner based on Postal code 

## Setup 

```
npm install
```

```
hs init
```

```
hs auth      
```

```
hs project upload
```

```
hs project dev     
```


## Serverless function 

In ```app.functions/serverless.json```

Add the function like so : 

```JavaScript
{
  "runtime": "nodejs16.x",
  "version": "1.0",
  "appFunctions": {
    "getRep": {
      "file": "getRep.js",
      "secrets": []
    }
  }
}
```

Here my function has the path : 

```
src/app/app.functions/getRep.js
```


## When config files are modified 

```
[WARNING] Changing project configuration requires a new project build. To reflect these changes and continue testing:
  * Stop `hs project dev`
  * Run `hs project upload`
  * Re-run `hs project dev`
```


## Get the current object id in the serverless function 

**In the extension**

```JavaScript

 runServerless({ 
    name: "getRep", 
    parameters: { text: text, postalCode : text },
    propertiesToSend: ['hs_object_id'] 
    }).then((resp) =>{
      //sendAlert({ message: resp.response })
      console.log(context)
      console.log(resp.response)
      setrepToAssign(resp.response);
    });
```

```runServerless``` takes an object as a parameter and we can attach to the serverless request some properties defined in an array. 

Here : ```propertiesToSend: ['hs_object_id'] ```
**In the serverless :**
```
  const { hs_object_id } = context.propertiesToSend;

  console.log("hs_object_id", hs_object_id)
```