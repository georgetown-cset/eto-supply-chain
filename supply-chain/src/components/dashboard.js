import React, {useEffect} from "react";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import Paper from "@mui/material/Paper";
import { Header as ETOHeader, Footer } from "@eto/eto-ui-components";

import Header from "./header";
import Map from "./map";
import { nodeToMeta } from "../../data/graph";
import { countryProvision } from "../../data/provision";

function getStyles(name, selectedName, theme) {
  return {
    fontWeight:
      selectedName !== name
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const Dashboard = () => {

  const getMaterialToNodes = () => {
    const materialToNode = {};
    for(let node in nodeToMeta){
      if(nodeToMeta[node]["type"] === "process"){
        for(let material of nodeToMeta[node]["materials"]){
          if(!(material in materialToNode)){
            materialToNode[material] = {};
          }
          materialToNode[material][node] = 1;
        }
      }
    }
    return materialToNode;
  };

  const getCurrentHighlights = (currFilterValues = filterValues) => {
    let highlighter = "material-resource";
    for(let fv in defaultFilterValues){
      if(defaultFilterValues[fv] !== currFilterValues[fv]){
        highlighter = fv;
      }
    }
    const currMapping = filterToValues[highlighter];
    if(highlighter === "material-resource") {
      const identityMap = {}
      identityMap[currFilterValues[highlighter]] = 1
      setHighlights(identityMap)
    } else {
      setHighlights(currMapping[currFilterValues[highlighter]]);
    }
  };

  const materialToNode = getMaterialToNodes();
  const theme = useTheme();
  const filterKeys = ["material-resource", "country"];
  const defaultFilterValues = {
    "material-resource": "All",
    "country": "All",
  };
  const filterToValues = {
    "material-resource": materialToNode,
    "country": countryProvision
  };
  const [filterValues, setFilterValues] = React.useState(defaultFilterValues);
  const [highlights, setHighlights] = React.useState({});

  const handleChange = (evt, key) => {
    const updatedFilterValues = {...defaultFilterValues};
    if (key !== null) {
      updatedFilterValues[key] = evt.target.value;
    }
    setFilterValues(updatedFilterValues);
    getCurrentHighlights(updatedFilterValues);
    // Put filter values in URL parameters.
    const urlParams = new URLSearchParams(window.location.search);
    for (const filterKey of filterKeys) {
      const filterVal = updatedFilterValues[filterKey];
      if (filterVal) {
        if (filterVal === defaultFilterValues[filterKey]) {
          urlParams.delete(filterKey);
        } else {
          urlParams.set(filterKey, filterVal);
        }
      }
    }
    window.history.replaceState(null, null, window.location.pathname + "?" + urlParams.toString());
  };

  // Sets the state of the app based on the queries in the URL.
  // This will only run once, when the component is initially rendered.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const updatedFilterValues = {...defaultFilterValues};
    for (const filterKey of filterKeys) {
      const filterVal = urlParams.get(filterKey);
      if (filterVal) {
        updatedFilterValues[filterKey] = filterVal;
      }
    }
    setFilterValues(updatedFilterValues);
    getCurrentHighlights(updatedFilterValues);
  }, [])

  return (<div>
    <ETOHeader/>
    <Header/>
    <Paper style={{paddingBottom: "20px", marginBottom: "5px", position: "sticky", top: "0px", width: "100%", zIndex: "10"}}
      className="filter-bar"
    >
      <div style={{display: "inline-block"}}>
      <FormControl sx={{m: 1}} size={"small"} style={{margin: "15px 0 0 15px", textAlign: "left", minWidth: "200px"}}>
        <InputLabel id="country-select-label">Countries</InputLabel>
        <Select
          labelId="country-select-label"
          id="country-select"
          value={filterValues["country"]}
          onChange={e => handleChange(e, "country")}
          input={<OutlinedInput label={"Country provision share"}/>}
        >
          <MenuItem
            key={"All"}
            value={"All"}
            style={getStyles("All", filterValues["country"], theme)}
            >
              All
          </MenuItem>
          {Object.keys(countryProvision).sort().filter((c) => c !== "Other").map((name) => (
            <MenuItem
              key={name}
              value={name}
              style={getStyles(name, filterValues["country"], theme)}
            >
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      </div>
      <div style={{display: "inline-block"}}>
      <FormControl sx={{m: 1}} size={"small"} style={{margin: "15px 0 0 15px", textAlign: "left", minWidth: "200px"}}>
        <InputLabel id="material-select-label">Inputs</InputLabel>
        <Select
          labelId="material-select-label"
          id="material-select"
          value={filterValues["material-resource"]}
          onChange={e => handleChange(e, "material-resource")}
          input={<OutlinedInput label={"Material component"}/>}
        >
          <MenuItem
            key={"All"}
            value={"All"}
            style={getStyles("All", filterValues["material-resource"], theme)}
            >
              All
          </MenuItem>
          {Object.keys(materialToNode).sort((a, b) => nodeToMeta[a]["name"] > nodeToMeta[b]["name"]).map((name) => (
            <MenuItem
              key={name}
              value={name}
              style={getStyles(name, filterValues["material-resource"], theme)}
            >
              {nodeToMeta[name]["name"]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      </div>
      <Button style={{float: "right", marginRight: "10px"}} onClick={(evt) => handleChange(evt, null)}>
        Clear
      </Button>
    </Paper>
    <div style={{display: "inline-block", minWidth: "700px", textAlign: "center"}}>
      <Map highlights={highlights} />
    </div>
    <Footer/>
  </div>);
};

export default Dashboard;
