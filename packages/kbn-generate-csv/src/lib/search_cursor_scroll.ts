/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { estypes } from '@elastic/elasticsearch';
import { lastValueFrom } from 'rxjs';
import type { Logger } from '@kbn/core/server';
import {
  ES_SEARCH_STRATEGY,
  type IEsSearchResponse,
  type ISearchSource,
  type SearchRequest,
} from '@kbn/data-plugin/common';
import { SearchCursor, type SearchCursorClients, type SearchCursorSettings } from './search_cursor';
import { i18nTexts } from './i18n_texts';

export class SearchCursorScroll extends SearchCursor {
  constructor(
    indexPatternTitle: string,
    settings: SearchCursorSettings,
    clients: SearchCursorClients,
    logger: Logger
  ) {
    super(indexPatternTitle, settings, clients, logger);
  }

  // The first search query begins the scroll context in ES
  public async initialize() {}

  private async scan(searchBody: SearchRequest) {
    const { includeFrozen, maxConcurrentShardRequests, scroll } = this.settings;

    const searchParamsScan = {
      params: {
        body: searchBody,
        index: this.indexPatternTitle,
        scroll: scroll.duration,
        size: scroll.size,
        ignore_throttled: includeFrozen ? false : undefined, // "true" will cause deprecation warnings logged in ES
        max_concurrent_shard_requests: maxConcurrentShardRequests,
      },
    };

    return await lastValueFrom(
      this.clients.data.search(searchParamsScan, {
        strategy: ES_SEARCH_STRATEGY,
        transport: {
          maxRetries: 0, // retrying reporting jobs is handled in the task manager scheduling logic
          requestTimeout: scroll.duration,
        },
      })
    );
  }

  private async scroll() {
    const { duration } = this.settings.scroll;
    return await this.clients.es.asCurrentUser.scroll(
      { scroll: duration, scroll_id: this.cursorId },
      {
        maxRetries: 0, // retrying reporting jobs is handled in the task manager scheduling logic
        requestTimeout: duration,
      }
    );
  }

  public async getPage(searchSource: ISearchSource) {
    if (this.cursorId) {
      this.logger.debug(
        `Executing search request with scroll ID [${this.formatCursorId(this.cursorId)}]`
      );
    } else {
      this.logger.debug(`Executing search for initial scan request.`);
    }

    let response: IEsSearchResponse | undefined;

    const searchBody: estypes.SearchRequest = searchSource.getSearchRequestBody();
    if (searchBody == null) {
      throw new Error('Could not retrieve the search body!');
    }

    if (this.cursorId == null) {
      response = await this.scan(searchBody);
    } else {
      response = { rawResponse: await this.scroll() };
    }

    if (!response) {
      throw new Error(`Response could not be retrieved!`);
    }

    const { rawResponse, ...rawDetails } = response;

    this.logSearchResults(rawDetails, rawResponse);
    this.logger.debug(`Received Scroll ID: [${this.formatCursorId(rawResponse._scroll_id)}]`);

    return rawResponse;
  }

  public updateIdFromResults(results: Pick<estypes.SearchResponse<unknown>, '_scroll_id'>) {
    this.cursorId = results._scroll_id ?? this.cursorId;
  }

  public async closeCursor() {
    if (this.cursorId) {
      this.logger.debug(`Executing clearScroll on ${this.formatCursorId(this.cursorId)}`);
      await this.clients.es.asCurrentUser.clearScroll({ scroll_id: [this.cursorId] });
    } else {
      this.logger.warn(`No Scroll Id to clear!`);
    }
  }

  public getUnableToCloseCursorMessage() {
    return i18nTexts.csvUnableToCloseScroll();
  }
}
