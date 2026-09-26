type AskAIProps = {
    prompt: string;
    isLoading: boolean;
    isDisabled: boolean;
    onPromptChange: (prompt: string) => void;
    onAsk: () => void;
};

export default function AskAI({ prompt, isLoading, isDisabled, onPromptChange, onAsk }: AskAIProps) {
    return (
        <section className="panel assistant-panel">
            <div className="assistant-row">
                <label htmlFor="assistant-prompt" className="form-field assistant-field">
                    <span className="field-label">Ask the seat assistant</span>
                    <input
                        id="assistant-prompt"
                        value={prompt}
                        onChange={(event) => onPromptChange(event.target.value)}
                        placeholder="Example: I need seats for a group of 4"
                        className="form-control form-control-select"
                    />
                </label>
                <button
                    type="button"
                    onClick={onAsk}
                    disabled={isDisabled || isLoading}
                    className="button button-assistant"
                >
                    {isLoading ? 'Thinking…' : 'Ask AI'}
                </button>
            </div>
            <p className="helper-text">
                The assistant interprets your request; the seat algorithm makes the final recommendation.
            </p>
        </section>
    );
}