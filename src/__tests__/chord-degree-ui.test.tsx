import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChordDegreePractice } from '../components/ChordDegreePractice';
import { GuitarAudioContext } from '../context/guitarAudioContext';
import { usePractice } from '../hooks/usePractice';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';

const playChord = vi.fn();
function Harness() {
  const practice = usePractice();
  return <GuitarAudioContext.Provider value={{ status:'ready', error:null, retry:vi.fn(), playNote:vi.fn(), playChord, playSequence:vi.fn(), stopSequence:vi.fn() }}><ChordDegreePractice settings={DEFAULT_SETTINGS} practice={practice} onClose={vi.fn()} /></GuitarAudioContext.Provider>;
}
describe('和弦级数练习', () => {
  it('选择答案时试听指法，提交后记录并显示正确答案', () => {
    localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', {name:'开始练习'}));
    expect(screen.getByText('C 大调 · 第 1 级')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'C'}));
    fireEvent.click(screen.getByRole('button', {name:'大三'}));
    expect(playChord).toHaveBeenCalled();
    expect(document.querySelectorAll('.dot-red').length).toBe(6);
    fireEvent.click(screen.getByRole('button', {name:'提交答案'}));
    expect(screen.getByText(/正确答案 C/)).toBeInTheDocument();
    expect(screen.getByText(/最近 1\/20 题/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name:'下一题'})).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

