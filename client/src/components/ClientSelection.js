import React, { useEffect, useState } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { CFormLabel } from '@coreui/react';
import { useClient } from '../contexts/ClientContexts';

const ClientSelection = ({ className, labelClassName, multiSelect = false, required = false, error = false, menuPlacement = 'bottom' }) => {
    const requiredIcon = required ? <span className="text-danger">*</span> : null;
    const { getAllClients } = useClient()

    const [clientId, setClientId] = useState()
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);


    const fetchClients = async (searchValue, loadedOptions, { page }) => {
        try {
            const response = await getAllClients(page, rowsPerPage, '_id', -1, searchValue);

            if (response.totalPages > 0) {
                const newOptions = response.clients.map((client) => ({
                    label: client.entity_name ? client.entity_name : `${client.first_name} ${client.last_name}`,
                    value: client._id,
                }));

                return {
                    options: newOptions,
                    hasMore: page !== response.totalPages,
                    additional: {
                        page: page + 1,
                    },
                };
            } else {
                return {
                    options: [],
                    hasMore: false,
                    additional: null,
                };
            }
        } catch (error) {
            console.error('Error fetching clients', error);
            return {
                options: [],
                hasMore: false,
                additional: null,
            };
        }
    };

    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            whiteSpace: state.isFocused ? 'pre-wrap' : 'nowrap',
            wordBreak: state.isFocused ? 'break-all' : null,
            wordWrap: state.isFocused ? 'break-word' : null,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        }),
    };

    return (
        <div className={className}>
            <div className='w-100'>
                <AsyncPaginate
                    className={`${(error && required) && 'multiSelect_error'}`}
                    value={clientId}
                    loadOptions={fetchClients}
                    isMulti={multiSelect}
                    closeMenuOnSelect={!multiSelect ? true : false}
                    onChange={(selectedOptions) => setClientId(selectedOptions)}
                    placeholder='Select clients...'
                    noOptionsMessage={() => ('No clients found')}
                    loadingMessage={() => ('Clients Loading...')}
                    loadOptionsOnMenuOpen={true}
                    additional={{
                        page: currentPage,
                    }}
                    SelectProps={{
                        isSearchable: true,
                        removeSelected: false,
                    }}
                    menuPlacement={menuPlacement}
                    // defaultMenuIsOpen={true}
                    menuShouldScrollIntoView={false}
                    menuPortalTarget={document.querySelector('body')}
                    styles={customStyles}
                />
                {(error && required) && <span className="text-danger error_message">{multiSelect ? `Please select one or more client(s)` : 'Please select any one client.'}</span>}
            </div>
        </div>
    );
};

export default ClientSelection;
