import React, {useEffect} from "react";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { AppIntro, AppWrapper, Dropdown } from "@eto/eto-ui-components";

import Map from "./map";
import { nodeToMeta } from "../../data/graph";
import {countryProvision, countryProvisionConcentration, orgProvision, providerMeta} from "../../data/provision";

const Dashboard = () => {

  const FILTER_INPUT = "input-resource";
  const FILTER_COUNTRY = "country";
  const FILTER_CONCENTRATION = "concentration";
  const FILTER_ORG = "organization";
  const MULTI_FILTERS = [FILTER_COUNTRY, FILTER_ORG];

  const getInputToNodes = () => {
    const inputTypes = ["materials", "tools"];
    const inputToNode = {};
    for(let node in nodeToMeta){
      if(nodeToMeta[node]["type"] === "process"){
        for (let inputType of inputTypes) {
          for(let input of nodeToMeta[node][inputType]){
            if(!(input in inputToNode)){
              inputToNode[input] = {};
            }
            inputToNode[input][node] = 1;
          }
        }
      }
    }
    return inputToNode;
  };

  const getCurrentHighlights = (currFilterValues = filterValues) => {
    let highlighter = FILTER_INPUT;
    for(let fv in defaultFilterValues){
      if(defaultFilterValues[fv] !== currFilterValues[fv]){
        highlighter = fv;
      }
    }
    const currMapping = filterToValues[highlighter];
    if(highlighter === FILTER_INPUT) {
      const identityMap = {"type": "binary"};  // Use binary on/off shading on nodes
      identityMap[currFilterValues[highlighter]] = 1;
      setHighlights(identityMap)
    } else {
      const highlightGradientMap = {"type" : "gradient"};  // Use gradient shading on nodes
      if (highlighter === FILTER_CONCENTRATION) {
        for (const nodeId in countryProvisionConcentration) {
          const numCountries = countryProvisionConcentration[nodeId];
          if (numCountries === 1) {  // Highly concentrated
            highlightGradientMap[nodeId] = 81;
          } else if (numCountries <= 3) {  // Medium concentrated
            highlightGradientMap[nodeId] = 41;
          } else {  // Not concentrated
            continue;
          }
        }
      } else if (MULTI_FILTERS.includes(highlighter)) {
        for (const name of currFilterValues[highlighter]) {
          // If name is "All", we ignore it
          if (!(name in currMapping)) {
            continue;
          }
          for (const provKey in currMapping[name]) {
            let provValue = currMapping[name][provKey]
            // We round qualitative "major"/"minor" values to numerical approximations
            if (provValue === "Major") {
              provValue = 80;
            } else if (provValue === "Minor") {
              provValue = 0;
            }
            if (isNaN(provValue)) {
              continue;
            }
            if (provKey in highlightGradientMap) {
              highlightGradientMap[provKey] += provValue;
            } else {
              highlightGradientMap[provKey] = provValue;
            }
          }
        }
      }
      setHighlights(highlightGradientMap);
    }
  };

  const inputToNode = getInputToNodes();
  const theme = useTheme();
  const filterKeys = [FILTER_INPUT, FILTER_COUNTRY, FILTER_ORG, FILTER_CONCENTRATION];
  const defaultFilterValues = {
    [FILTER_INPUT]: "All",
    [FILTER_COUNTRY]: ["All"],
    [FILTER_ORG]: ["All"],
    [FILTER_CONCENTRATION]: false,
  };
  const filterToValues = {
    [FILTER_INPUT]: inputToNode,
    [FILTER_COUNTRY]: countryProvision,
    [FILTER_ORG]: orgProvision,
    [FILTER_CONCENTRATION]: [true, false],
  };
  const [filterValues, setFilterValues] = React.useState(defaultFilterValues);
  const [highlights, setHighlights] = React.useState({});
  const [documentationPanelToggle, setDocumentationPanelToggle] = React.useState(false);

  const handleChange = (val, key) => {
    const updatedFilterValues = {...defaultFilterValues};
    if (key !== null) {
      if (MULTI_FILTERS.includes(key) && (val.length > 1)){
        if(filterValues[key].includes("All")){
          updatedFilterValues[key] = val.filter((v) => v !== "All");
        } else {
          // if the user has just added the all value, clear out the rest of the values
          updatedFilterValues[key] = val.includes("All") ? ["All"] : val;
        }
      } else {
        updatedFilterValues[key] = val;
      }
    }
    setFilterValues(updatedFilterValues);
    if (updatedFilterValues[FILTER_INPUT] !== defaultFilterValues[FILTER_INPUT]) {
      setDocumentationPanelToggle(true);
    }
    getCurrentHighlights(updatedFilterValues);
    // Put filter values in URL parameters.
    const urlParams = new URLSearchParams(window.location.search);
    for (const filterKey of filterKeys) {
      const filterVal = updatedFilterValues[filterKey];
      if (filterVal !== null) {
        if (filterVal === defaultFilterValues[filterKey]) {
          urlParams.delete(filterKey);
        } else {
          urlParams.set(filterKey, filterVal);
        }
      }
    }
    window.history.replaceState(null, null, window.location.pathname + "?" + urlParams.toString());
  };

  // Functions to interface with ETO dropdown component
  const countryOptions = [{"val": "All", "text": "All"}];
  Object.keys(countryProvision).sort().filter((c) => c !== "Other").map((name) => (
    countryOptions.push({"val": name, "text": name})
  ));

  const inputResourceOptions = [{"val": "All", "text": "All"}];
  Object.keys(inputToNode).sort(
    (a, b) => ('' + nodeToMeta[a]["name"]).localeCompare(nodeToMeta[b]["name"])
  ).map((name) => (
    inputResourceOptions.push({"val": name, "text": nodeToMeta[name]["name"]})
  ));

  const organizationOptions = [{"val": "All", "text": "All"}];
  Object.keys(orgProvision).sort(
    (a, b) => ('' + providerMeta[a]["name"]).localeCompare(providerMeta[b]["name"])
  ).map((name) => (
    organizationOptions.push({"val": name, "text": providerMeta[name]["name"]})
  ));

  const handleConcentrationChange = (evt) => {
    handleChange(evt.target.checked, FILTER_CONCENTRATION);
  };

  const dropdownParams = [
    {
      "label": "Countries",
      "key": FILTER_COUNTRY,
      "options": countryOptions
    },
    {
      "label": "Inputs",
      "key": FILTER_INPUT,
      "options": inputResourceOptions
    },
    {
      "label": "Organizations",
      "key": FILTER_ORG,
      "options": organizationOptions
    },
  ];

  // Sets the state of the app based on the queries in the URL.
  // This will only run once, when the component is initially rendered.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const updatedFilterValues = {...defaultFilterValues};
    for (const filterKey of filterKeys) {
      let filterVal = urlParams.get(filterKey);
      if (filterVal !== null) {
        if (MULTI_FILTERS.includes(filterKey)) {
          // This is a multi-select, so we need to pass in an array
          filterVal = filterVal.split(",");
        }
        updatedFilterValues[filterKey] = filterVal;
      }
    }
    setFilterValues(updatedFilterValues);
    if (updatedFilterValues[FILTER_INPUT] !== defaultFilterValues[FILTER_INPUT]) {
      setDocumentationPanelToggle(true);
    }
    getCurrentHighlights(updatedFilterValues);
  }, []);

  return (<AppWrapper>
    <div style={{margin: "40px 20px 40px 100px", maxWidth: "1200px"}}>
    <AppIntro title={"Supply Chain Explorer"} content={<Typography component={"div"} variant={"body1"}>
      ETO’s Supply Chain Explorer visualizes supply chains in critical and emerging technology.
      This edition of the Explorer covers the essential tools, materials, processes, countries,
      and firms involved in producing advanced logic chips. It’s built to help users who are not
      semiconductor experts get up to speed on how this essential technology is produced, and
      to allow users of all backgrounds to visually explore how different inputs, companies,
      and nations interact in the production process.
    </Typography>}/>
    </div>
    <Paper style={{padding: "20px 0px 20px 10px", position: "sticky", top: "0px", width: "100%", zIndex: "10"}}
      className="filter-bar"
      elevation={0}
    >
      {dropdownParams.map((dropdown) =>
        <div key={dropdown.label}>
          <Dropdown
            inputLabel={dropdown.label}
            selected={filterValues[dropdown.key]}
            setSelected={(evt) => handleChange(evt, dropdown.key)}
            multiple={MULTI_FILTERS.includes(dropdown.key)}
            options={dropdown.options}
          />
        </div>
      )}
      <FormControlLabel id="concentration-checkbox" control={
        <Checkbox checked={filterValues[FILTER_CONCENTRATION]} onChange={handleConcentrationChange} />
      } label="Show Concentration" />
      <Button id="clear-button" style={{marginLeft: "20px", fontSize: "1rem"}} variant={"outlined"} onClick={(evt) => handleChange(evt, null)}>
        Clear
      </Button>
    </Paper>
    <div style={{display: "inline-block", minWidth: "700px", width: "100%", textAlign: "center"}}>
      <Map highlights={highlights} filterValues={filterValues} defaultFilterValues={defaultFilterValues}
        documentationPanelToggle={documentationPanelToggle} setDocumentationPanelToggle={setDocumentationPanelToggle} />
    </div>
  </AppWrapper>);
};

export default Dashboard;
