
import './App.css';
import Items from "./Items.js";
import Recipes from "./Recipes.js"
import { useEffect, useState, useRef } from "react";
import axios from "axios";






function App() {
  const [items, setItems] = useState([]);
  const [errorMessage, setErrorMessage] =useState("");
  const [userInput, setUserInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recipeList, setRecipeList] = useState([])

  const baseURL = "https://xivapi.com";

  const itemsRef = useRef(null);
  const recipesRef = useRef(null);

  // Function queries API, also takes in end point to query
  // Takes in endpoint as a string and a params object
  async function fetchData(endpoint, params) {
    const data = await axios({
      url: baseURL + endpoint,
      method: "GET",
      dataResponse: "json",
      params: params
    })
    return data
  }

  
  //  Gets the search term on form submit and queries API 
  useEffect(() => {
    fetchData("/search", {
      indexes: "Recipe",
      string: searchTerm,
      limit: 9
    }).then(response => {
      
      if (response.data.Results.length === 0){
        setErrorMessage("Sorry we could not find the item, try searching something else!")
      }
      else {
        setErrorMessage(""); // Clears previous error messages
        setItems(response.data.Results);
      }

    }).catch(error => {
      // This will catch an error communicating with the API
      setErrorMessage("Sorry something went wrong getting information from the FFXIV API");
    })
    
  }, [searchTerm])

  const handleInput = (event) => {
    setUserInput(event.target.value);
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setSearchTerm(userInput);
    //Scrolls to items header
    itemsRef.current.scrollIntoView();
  }

  //Take in an endpoint such as /Recipe/23 and an object with simple item info that was pulled from the /Search API call
  const getRecipeInfo = (idEndpoint, itemInfo) => {
    if (idEndpoint) {
      fetchData(idEndpoint)
        .then((response) => {
          const data = response.data;
          //The data returned is very cluttered and has seperate properties for each ingredient. It has seperate properties for each ingredient up to 9 and most of them are usually empty. This checks each ingredient in a loop to see if it has more than 0 and then if it does it gets info from the ItemIngredient property and creates an object for each ingredient.
          const ingredientArray = [];
          
          //Make copy of state recipeList
          const recipeListCopy = [...recipeList]
          for (let i = 0; i < 10; i++) {
            const ingredientObject = {};
            if (data[`AmountIngredient${i}`] > 0) {
              ingredientObject.name = data[`ItemIngredient${i}`].Name
              ingredientObject.ID = data[`ItemIngredient${i}`].ID
              ingredientObject.amount = data[`AmountIngredient${i}`];
              ingredientObject.image = baseURL + data[`ItemIngredient${i}`].Icon
              // Adds in individual ingredient object onto the array
              ingredientArray.push(ingredientObject)
              
            }
          }
          //The name and icon here are added in case it came from sub recipe and didnt have a name/icon on the item info
          itemInfo.Name = data.Name;
          itemInfo.Icon = data.Icon;
          // Adds class info
          itemInfo.class = data.ClassJob.Abbreviation
          // Adds a property with each ingredients info in a list
          itemInfo.ingredientArray = ingredientArray;
          // Hands over ingredient Aray, itemInfo so it can append ingredients to it, and recipeList so it can change state recipeList
          subRecipeChecker(ingredientArray, itemInfo, recipeListCopy);
        })
        .catch(error => {
          setErrorMessage("Sorry something went wrong getting the recipe info")
        })
    } 
    else {
      setErrorMessage("Recipe ID doesn't exists")
    }
  }

  const closeRecipe = id => {
    const recipeListCopy = [...recipeList];
    const newRecipeList = recipeListCopy.filter( recipe => recipe.ID !== id );
    setRecipeList(newRecipeList);
  }


  //This takes in information from getRecipe info and queries the API using each ingredient ID
  //If the item ID exists as a recipe it will take the recipe ID and add it as a property to the ingredient object
  // This will be used in the subRecipe button handler
  const subRecipeChecker = (ingredientListCopy, itemInfo, recipeListCopy) => {
    const idList = ingredientListCopy.map((ingredient) => {
      return ingredient.ID
    })
    
    fetchData("/item", {
      ids: idList.toString(),
      columns:"Recipes,ID"
    }).then((response)=>{
      const data = response.data.Results;
      
      //This loops through the array returned from the API since it returns out of order from the IDs you query
      data.forEach((recipeQuery) => {
        ingredientListCopy.forEach((ingredient) => {
          if (recipeQuery.ID === ingredient.ID && recipeQuery.Recipes){
            ingredient.recipe = recipeQuery.Recipes
            return ingredient
          }
        })
      })
      
     
      recipeListCopy.push(itemInfo);
      //Keeps the recipe in the recipeList state variable so it can hold multiple recipes
      setRecipeList(recipeListCopy);
      recipesRef.current.scrollIntoView(false);
    }).catch(error => {
      setErrorMessage("Sorry something went wrong getting the recipe info")
    })

  }

  //This will get the recipe ID(or IDs) in an array and then call the getRecipeInfo function to add it to the page
  const subRecipeButtonHandler = (recipeArray, itemInfo) => {
    recipeArray.forEach((recipe) => {
      const recipeURL = "/Recipe/" + recipe.ID
      getRecipeInfo(recipeURL, itemInfo)
    })
    
  }

  const clearRecipes = () => {
    setRecipeList([]);
  }

  return (
    <div className="App">
      <header>
        <div className="wrapper">
          <img src={require("./assets/logo.png")} alt="Final Fantast 14 logo" />
          <h1>FFXIV Craftable Items Search</h1>
          <h2>Search for a craftable item from the game Final Fantasy 14</h2>
          <p>Try searching for Iron or Lance to find some stuff!</p>
          <p className="error">{
            errorMessage
              ? errorMessage
              : null
          }</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="search"></label>
            <input type="text" id="search" onChange={handleInput} value={userInput} placeholder="Item name..." />
            <button>Search</button>
          </form>
        </div>
      </header>
      <main>
        <section className="itemsSection">
          <h2 ref={itemsRef}>Items</h2>
          <Items items={items} getRecipeInfo={getRecipeInfo} />
          <p className="error">{
            errorMessage
              ? errorMessage
              : null
          }</p>
        </section>
        <section ref={recipesRef} className="recipesSection">
          {(recipeList.length > 0)
            ? (
              <div className="wrapper">
                <h2>Recipes</h2>
                <div className="clearButtonContainer">
                  <button onClick={clearRecipes} className="clearButton">Clear</button>
                </div>
              </div>
            )
            : null
          }
          <Recipes recipes={recipeList} closeRecipe={closeRecipe} subRecipeButtonHandler={subRecipeButtonHandler} />
        </section>
       
      </main>
      <footer>
        <p>Created at <a href="https://junocollege.com/">Juno College</a></p>
      </footer>
    </div>
  );
}

export default App;
