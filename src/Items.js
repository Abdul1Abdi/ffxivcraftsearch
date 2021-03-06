import { nanoid } from "nanoid";

const baseURL = "https://xivapi.com";


function Items(props){
    return(
        <div className="wrapper gallery">
            {props.items.map((item) => {
                
                return (
                    <div key ={nanoid()} className="itemContainer">
                        <img src={baseURL + item.Icon} alt="" />
                        <p>{item.Name}</p>
                        <button className="itemButton" 
                        onClick={() => props.getRecipeInfo(item.Url, item)}>Recipe</button>
                    </div>
                )
            })}
        </div>       
    )
             
                
         
}

export default Items;