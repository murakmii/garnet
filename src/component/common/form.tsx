import { ReactEventHandler, ReactNode } from 'react';

import './form.scss';

export type SelectProps = {
  name: string;
  items: SelectItem[];
  value: string;
  onChange?: (name: string, value: string) => void;
};

export type SelectItem = {
  name: string;
  value: string;
};

// 汎用コンボボックス
export const Select = (props: SelectProps) => {
  return (
    <select 
      className="Select"
      name={props.name} 
      
      onChange={e => props.onChange?.(props.name, e.target.value)}>
      {props.items.map(i => (
        <option value={i.value}>{i.name}</option>
      ))}
    </select>
  )
};

// 汎用ボタン
export const Button = ({ disabled, children, onClick }: { onClick?: () => void, disabled?: boolean, children?: ReactNode }) => {
  return (
    <button onClick={onClick} className="Button" disabled={disabled}>
      {children}
    </button>
  );
};

type TextAreaProps = {
  name: string;
  value?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  onChange?: (name: string, value: string) => void;
  onSubmitByKey?: () => void;
}

// 汎用テキスト入力
export const TextArea = ({ name, value, placeholder, multiline, disabled, onChange, onSubmitByKey }: TextAreaProps) => {
  return multiline ? (
    <textarea 
      disabled={disabled}
      className="TextArea Multiline" 
      name={name} 
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(name, e.target.value)}
      onKeyDown={(e) => {
        if (!disabled && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          onSubmitByKey?.();
        }
      }} />
  ) : (
    <input 
      disabled={disabled}
      className="TextArea" 
      type="text" 
      name={name} 
      value={value}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(name, e.target.value)} />
  );
};

export type CheckBoxProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const CheckBox = ({ name, label, onChange, checked }: CheckBoxProps) => {
  return (
    <div className="CheckBox">
      <input type="checkbox" name={name} id={`CheckBox-${name}`} onChange={onChange} checked={checked} />
      <label htmlFor={`CheckBox-${name}`}>{label}</label>
    </div>
  );
};
