import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ExpandedField from '../components/ExpandedField';
import Textarea from '../components/Textarea';
import Markdown from '../components/Markdown';
import ButtonCopy from '../components/ButtonCopy';
import useChat from '../hooks/useChat';
import { create } from 'zustand';
import { summarizePrompt } from '../prompts';
import { I18n } from 'aws-amplify';

type StateType = {
  sentence: string;
  setSentence: (s: string) => void;
  additionalContext: string;
  setAdditionalContext: (s: string) => void;
  summarizedSentence: string;
  setSummarizedSentence: (s: string) => void;
  clear: () => void;
};

const useSummarizePageState = create<StateType>((set) => {
  const INIT_STATE = {
    sentence: '',
    additionalContext: '',
    summarizedSentence: '',
  };
  return {
    ...INIT_STATE,
    setSentence: (s: string) => {
      set(() => ({
        sentence: s,
      }));
    },
    setAdditionalContext: (s: string) => {
      set(() => ({
        additionalContext: s,
      }));
    },
    setSummarizedSentence: (s: string) => {
      set(() => ({
        summarizedSentence: s,
      }));
    },
    clear: () => {
      set(INIT_STATE);
    },
  };
});

const SummarizePage: React.FC = () => {
  const {
    sentence,
    setSentence,
    additionalContext,
    setAdditionalContext,
    summarizedSentence,
    setSummarizedSentence,
    clear,
  } = useSummarizePageState();
  const { state, pathname } = useLocation();
  const { loading, messages, postChat, clear: clearChat } = useChat(pathname);

  const disabledExec = useMemo(() => {
    return sentence === '' || loading;
  }, [sentence, loading]);

  useEffect(() => {
    if (state !== null) {
      setSentence(state.sentence);
      setAdditionalContext(state.additionalContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const getSummary = (sentence: string, context: string) => {
    postChat(
      summarizePrompt({
        sentence,
        context,
      }),
      true
    );
  };

  // リアルタイムにレスポンスを表示
  // show response in real time
  useEffect(() => {
    if (messages.length === 0) return;
    const _lastMessage = messages[messages.length - 1];
    if (_lastMessage.role !== 'assistant') return;
    const _response = messages[messages.length - 1].content;
    setSummarizedSentence(
      _response.replace(/(<output>|<\/output>)/g, '').trim()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // 要約を実行
  // execute summary
  const onClickExec = useCallback(() => {
    if (loading) return;
    getSummary(sentence, additionalContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence, additionalContext, loading]);

  // リセット
  // resetting
  const onClickClear = useCallback(() => {
    clear();
    clearChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-12">
      <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:visible lg:my-5 lg:h-min">
        {I18n.get("appointment")}
      </div>
      <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
        <Card label={I18n.get("summarize_sentences")}>
          <Textarea
            placeholder={I18n.get("please_enter")}
            value={sentence}
            onChange={setSentence}
            maxHeight={-1}
          />

          <ExpandedField label={I18n.get("additional_context")}optional>
            <Textarea
              placeholder={I18n.get("additional_context_placeholder")}
              value={additionalContext}
              onChange={setAdditionalContext}
            />
          </ExpandedField>

          <div className="flex justify-end gap-3">
            <Button outlined onClick={onClickClear} disabled={disabledExec}>
              {I18n.get("clear")}
            </Button>

            <Button disabled={disabledExec} onClick={onClickExec}>
              {I18n.get("execute")}
            </Button>
          </div>

          <div className="mt-5 rounded border border-black/30 p-1.5">
            <Markdown>{summarizedSentence}</Markdown>
            {!loading && summarizedSentence === '' && (
              <div className="text-gray-500">
                {I18n.get("summarized_sentences")}
              </div>
            )}
            {loading && (
              <div className="border-aws-sky h-5 w-5 animate-spin rounded-full border-4 border-t-transparent"></div>
            )}
            <div className="flex w-full justify-end">
              <ButtonCopy text={summarizedSentence}></ButtonCopy>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SummarizePage;
