import React from 'react';
import ReactFileReader from 'react-file-reader';
import  '../style/homepage.scss';
import { CsvToHtmlTable } from 'react-csv-to-table';
import axios from 'axios';
import Select from 'react-select';
import components from 'react-select';

const VALIDATE_COLUMNS_URL = "http://localhost:8000/api/validcolumns/";
const TRAIN_MODEL_URL = "http://localhost:8000/api/trainmodel/";

export default function DataChart() {

    //const [isUploaded, setIsUploaded] = React.useState(false);
    const [csvData, setCsvData] = React.useState();
    const [csvArrayData, setCsvArrayData] = React.useState();
    const [validColumnsString, setValidColumnsString] = React.useState();
    const [validColumnsArray, setValidColumnsArray] = React.useState();
    const [selectedTrainingFeatures, setSelectedTrainingFeatures] = React.useState();
    const [selectedOutputFeature, setSelectedOutputFeature] = React.useState();
    const [modelID, setModelID] = React.useState();
    const [formData, setFormData] = React.useState();

    const handleFiles = (files) => {
        var reader = new FileReader();
        reader.onload = function(e) {
            // Use reader.result
            setCsvData(reader.result);
            setCsvArrayData(convertCSVToListOfObjects(reader.result));
        }
        reader.readAsText(files[0]);
    }

    const convertCSVToListOfObjects = (data) => {
        const headers = data.slice(0, data.indexOf("\n")).split(",");

        const rows = data.slice(data.indexOf("\n")+1).split("\n");

        const arr = rows.map(function (row) {
            const values = row.split(",");
            const el = headers.reduce(
                function (object, header, index) {
                    // check if its a number...
                    if(!isNaN(values[index])){
                        object[header] = Number(values[index]);
                    }
                    //check if its a boolean
                    else if(values[index]==="False"){
                        object[header] = 0;
                    }
                    else if(values[index]==="True"){
                        object[header] = 1;
                    }
                    else{
                        object[header] = values[index];
                    }
                    return object;
                }, {});
            
            return el;
          });

        //setCsvArrayData(arr);
        return(arr);
    }

    const handleAcceptableColumnsButton = () => {
        

        const requestBody = {
            "data": csvArrayData
        }
       
        axios.post(VALIDATE_COLUMNS_URL, requestBody)
            .then((response) => {
                setValidColumnsString(response.data.valid_cols.join(", "));
                setValidColumnsArray(response.data.valid_cols);
            });
    }

    const handleTrainingFeatureChanges = (event) => {
        setSelectedTrainingFeatures(event.map(entry => entry.value));
    }

    const handleOutputFeatureChanges = (event) => {
        setSelectedOutputFeature(event.value);
    }

    const trainModel = () => {
        // error handle - they didnt select features
        if(!selectedOutputFeature || !selectedTrainingFeatures || selectedTrainingFeatures.length === 0){
            alert('choose all the features you need');
            return;
        }
        
        // error handle - their output feature is listed in their input features
        if(selectedTrainingFeatures.includes(selectedOutputFeature)){
            alert('output feature must not be in the training features');
            return;
        }

        if(!(csvArrayData[0][selectedOutputFeature] == 0 || csvArrayData[0][selectedOutputFeature] == 1)){
            alert('output feature must be a boolean');
        }

        const requestBody = {
            "data": csvArrayData, 
            "inputs": selectedTrainingFeatures,
            "output": selectedOutputFeature,
        }
        axios.post(TRAIN_MODEL_URL, requestBody)
            .then((response) => {
                const modelID = response.data.model_id
                setModelID(modelID)
            });


    }

    return (
     <div className="datachart-container">
        {csvData && 
            <CsvToHtmlTable
                data={csvData}
                csvDelimiter=","
                tableClassName="table table-striped table-hover"
            />
        }
        <div className="right-side-container">
            <ReactFileReader handleFiles={handleFiles} fileTypes={'.csv'}>
                <button className='btn'>Upload New File</button>
            </ReactFileReader>
            {csvData &&
                <div>
                    <button onClick={handleAcceptableColumnsButton}>
                        Find Acceptable Columns for Training
                    </button>
                </div>
            }
            {validColumnsString && 
                <div>Valid Columns List [{validColumnsString}]</div>
            }

            {validColumnsString &&
                <div className="feature-select-container">
                    <h1>Train a Model</h1>
                    <h4>Select your training features</h4>
                    <Select
                        options={validColumnsArray.map((option) => {
                            return {value: option, label: option}
                        })} 
                        isMulti={true}
                        onChange={handleTrainingFeatureChanges}
                    />
                    <h4>Select your Output Feature</h4>
                    <Select
                        options={validColumnsArray.map((option) => {
                            return {value: option, label: option}
                        })} 
                        isMulti={false}
                        onChange={handleOutputFeatureChanges}
                    />
                    <button onClick={trainModel}>Train Model</button>
                </div>
                
            }

            {modelID && 
                <div>
                    <h2>Inference your model</h2>
                    <form>
                        <fieldset>

                            {selectedTrainingFeatures.map(feature => {
                                return(
                                    <label>
                                        <p>{feature}</p>
                                        <input name={feature}/>
                                    </label>
                                );
                                
                            })}
                        </fieldset>
                        <button type="submit">Submit</button>
                    </form>
                </div>
                
            }
            

        </div>
        
    </div>
    );
  }
  