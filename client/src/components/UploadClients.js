import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ClientListLayout from './ClientListLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContexts';
import Loader from './Loader'

const UploadCsv = () => {
    const navigate = useNavigate()
    const { auth } = useAuth()
    const { importClient } = useClient()

    const [isLoading, setIsLoading] = useState(false)
    const [files, setFiles] = useState([])
    const [fileName, setFileName] = useState("")

    const onDrop = useCallback((acceptedFiles) => {
        setFileName(acceptedFiles[0]?.name)
        setFiles(acceptedFiles)
    }, []);

    const csvToObject = (csvData) => {
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(header => header.trim());

        return rows.slice(1).map(row => {
            const values = row.split(',').map(value => {
                value = value.trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                return value || '';
            });

            let obj = {};
            headers.forEach((header, index) => {
                const key = header.toLowerCase().replace(/\s+/g, '_');
                obj[key] = values[index] || '';
            });
            return obj;
        });
    };

    const validateRowData = async (rowData) => {
        for (const row of rowData) {
            const clientCode = row?.client_code?.trim();
            const hasClientCode = clientCode !== '' && typeof clientCode !== 'undefined';

            if (hasClientCode) {
                const clientInfo = {
                    abn_number: row?.abn_number || "",
                    preferred_name: row?.preferred_name || "",
                    phone: row?.phone || "",
                    client_code: row?.client_code?.trim() ? row?.client_code?.trim() : "",
                    email: row?.email || "",
                    user_defined: row?.user_defined || "",
                    address: row?.address || "",
                    entity_name: row?.entity_name || "",
                    first_name: row?.first_name || "",
                    last_name: row?.last_name || ""
                };

                return clientInfo
            } else {
                return null
            }
        }
    };

    const handleUpload = async () => {
        const clientsToImport = []
        setIsLoading(true);

        for (const fileIndex in files) {
            const file = files[fileIndex];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const csvData = event.target.result;
                const rowData = csvToObject(csvData);

                for (const rowIndex in rowData) {
                    const row = rowData[rowIndex];
                    const clientInfo = await validateRowData([row]);
                    if (clientInfo !== null) {
                        clientsToImport.push(clientInfo)
                    }

                    if (parseInt(fileIndex) === files.length - 1 && parseInt(rowIndex) === rowData.length - 1) {
                        await importClient(JSON.stringify(clientsToImport))
                        setIsLoading(false);
                        setFiles([]);
                        navigate("/user/clients");
                    }
                }
            };

            reader.readAsText(file);
            await new Promise((resolve) => reader.onloadend = resolve);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': [],
        },
        multiple: false
    });
    return (
        <>
            <ClientListLayout>
                {isLoading ? (
                    <Loader />
                ) :
                    (
                        <>
                            <div className="special_flex mb-25">
                                <h1 className="main_title">Spreadsheet</h1>
                                <div className="right_flex">
                                    <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>
                                        <img src="images/pre_white.svg" alt="" /> Back to list
                                    </button>
                                </div>
                            </div>
                            <div className="sheet_accodian">
                                <div className="accordion" id="accordionExample">
                                    <div className="accordion-item dragdrop_box">
                                        <h2 className="accordion-header" id="headingOne">
                                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                                aria-expanded="true" aria-controls="collapseOne">
                                                Drag and Drop file
                                            </button>
                                        </h2>
                                        <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne"
                                            data-bs-parent="#accordionExample">
                                            <div className="accordion-body">
                                                <div className="upload-area" {...getRootProps()}>
                                                    <input {...getInputProps()} />
                                                    {
                                                        isDragActive ?
                                                            <h2>
                                                                Drop the files here...
                                                            </h2> :
                                                            <h2 className="text-center">
                                                                Drag and Drop file here
                                                                <div className="my-2 fw-bold">Or</div>
                                                                <span className="select-file">Click to select file</span>
                                                            </h2>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {fileName && (
                                <p>{fileName}</p>
                            )}
                            <div className="flex_btn">
                                <button className={`common_btn ${files.length <= 0 && 'opacity-50'}`} onClick={() => handleUpload()} disabled={files.length <= 0}>Upload</button>
                            </div>
                        </>
                    )}
            </ClientListLayout>
        </>
    );
};

export default UploadCsv;
