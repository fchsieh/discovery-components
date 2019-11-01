import React, { useContext } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash.isequal';
import mustache from 'mustache';
import { settings } from 'carbon-components';
import DiscoveryV2 from '@disco-widgets/ibm-watson/discovery/v2';
import { SearchApi, SearchContext, SelectedResult } from '../../../DiscoverySearch/DiscoverySearch';
import { ResultElement } from '../ResultElement/ResultElement';

export interface ResultProps {
  /**
   * specify a field on the result object to pull the displayed text from
   */
  bodyField: string;
  /**
   * specify a label to display instead of 'Collection Name:' on each search result
   */
  collectionLabel?: string;
  /**
   * collection name to render on each search result
   */
  collectionName?: string;
  /**
   * override the default button text for viewing displayed text (either a passage or a specified bodyfied) in the document
   */
  displayedTextInDocumentButtonText: string;
  /**
   * specify a className for styling <em> tags within passages
   */
  passageHighlightsClassName?: string;
  /**
   * the query result document associated with the search result
   * TODO: Once the tables only results are also linked to their documents, this will no longer be optional
   */
  result?: DiscoveryV2.QueryResult;
  /**
   * specify a field on the result object to pull the result link from
   */
  resultLinkField?: string;
  /**
   * specify a string template using mustache templating syntax https://github.com/janl/mustache.js to create the title from each result object
   */
  resultLinkTemplate?: string;
  /**
   * specify a field on the result object to pull the result title from
   */
  resultTitleField: string;
  /**
   * specifies whether to show tables only results or regular search results
   */
  showTablesOnlyResults?: boolean;
  /**
   * the table result element for the search result
   */
  table?: DiscoveryV2.QueryTableResult;
  /**
   * override the default button text for viewing a table in the document
   */
  tableInDocumentButtonText: string;
  /**
   * specify whether or not passages should be displayed in the search results
   */
  usePassages?: boolean;
}
export const Result: React.FunctionComponent<ResultProps> = ({
  bodyField,
  collectionLabel,
  collectionName,
  displayedTextInDocumentButtonText,
  passageHighlightsClassName,
  result,
  resultLinkField,
  resultLinkTemplate,
  resultTitleField,
  showTablesOnlyResults,
  table,
  tableInDocumentButtonText,
  usePassages
}) => {
  const { setSelectedResult } = useContext(SearchApi);
  const { selectedResult } = useContext(SearchContext);

  const firstPassage: DiscoveryV2.QueryResultPassage | undefined = get(
    result,
    'document_passages[0]'
  );
  let displayedText: string | undefined;
  if (usePassages) {
    displayedText = get(firstPassage, 'passage_text') || get(result, bodyField);
  } else {
    displayedText = get(result, bodyField);
  }
  const displayedTextElement = usePassages && firstPassage ? firstPassage : null;
  const displayedTextElementType = usePassages && firstPassage ? 'passage' : null;
  const tableHtml: string | undefined = get(table, 'table_html');

  // TODO: This if to look for result can go away once that's being passed through with the tables only results
  let documentId;
  if (result) {
    documentId = result.document_id;
  }
  const title = get(result, resultTitleField);
  const filename: string | undefined = get(result, 'extracted_metadata.filename');

  const baseClassName = `${settings.prefix}--search-result`;
  const searchResultClasses = [baseClassName];
  if (isEqual(result, selectedResult.document)) {
    searchResultClasses.push(`${baseClassName}--selected`);
  }
  const documentRetrievalSource: string | undefined = get(
    result,
    'result_metadata.document_retrieval_source'
  );
  if (documentRetrievalSource === 'curation') {
    searchResultClasses.push(`${baseClassName}_curation`);
  }
  const searchResultContentWrapperClasses = [`${baseClassName}__content-wrapper`];
  if (displayedText && tableHtml && !showTablesOnlyResults) {
    searchResultContentWrapperClasses.push(`${baseClassName}__content-wrapper--half`);
  }
  const footerClassName = `${baseClassName}__footer`;
  const titleClassName = `${baseClassName}__footer__title`;
  const collectionNameClassName = `${baseClassName}__footer__collection-name`;

  const handleSelectResult = (
    element: SelectedResult['element'],
    elementType: SelectedResult['elementType']
  ) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      if (resultLinkField || resultLinkTemplate) {
        // expected behavior, use the resultLinkField if it exists over the resultLinkTemplate
        const url = resultLinkField
          ? get(result, resultLinkField)
          : mustache.render(resultLinkTemplate as string, result);
        window.open(url);
        // TODO: This if can go away once tables are linked to their documents and results are always passed through
      } else if (result) {
        setSelectedResult({ document: result, element, elementType });
      }
    };
  };

  return (
    <div className={searchResultClasses.join(' ')}>
      <div className={searchResultContentWrapperClasses.join(' ')}>
        {displayedText && !showTablesOnlyResults && (
          <ResultElement
            baseClassName={baseClassName}
            body={displayedText}
            buttonText={displayedTextInDocumentButtonText}
            element={displayedTextElement}
            elementType={displayedTextElementType}
            handleSelectResult={handleSelectResult}
            passageHighlightsClassName={passageHighlightsClassName}
            showTablesOnlyResults={showTablesOnlyResults}
          />
        )}
        {tableHtml && (
          <ResultElement
            baseClassName={baseClassName}
            body={tableHtml}
            buttonText={tableInDocumentButtonText}
            element={table}
            elementType="table"
            handleSelectResult={handleSelectResult}
            showTablesOnlyResults={showTablesOnlyResults}
          />
        )}
      </div>
      {/* TODO: This check can go away once documents are linked to show only tables results */}
      {(collectionName || result) && (
        <div className={footerClassName}>
          {/* TODO: This result check can go away once documents are linked to show only tables results */}
          {result && <div className={titleClassName}>{title || filename || documentId}</div>}
          {collectionName && (
            <div className={collectionNameClassName}>
              {collectionLabel} {collectionName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};