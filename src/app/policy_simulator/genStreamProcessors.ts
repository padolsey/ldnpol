import TagStreamProcessor from '@/app/utils/TagStreamProcessor';
import SPECIAL_CHARACTERS from './SPECIAL_CHARACTERS';

function escapeHtml(unsafe: string) {
  return unsafe
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
}

const genProcessors = () => ({
  pros: new TagStreamProcessor(
    SPECIAL_CHARACTERS.pros,
    SPECIAL_CHARACTERS.pros + '<pros>',
    '</pros>',
    SPECIAL_CHARACTERS.loading,
    async (contents) => {
      console.log('Pros innards', contents);
      return `<p>Pros: ${escapeHtml(contents)}</p>`;
    }
  ),

  cons: new TagStreamProcessor(
    SPECIAL_CHARACTERS.cons,
    SPECIAL_CHARACTERS.cons + '<cons>',
    '</cons>',
    SPECIAL_CHARACTERS.loading,
    async (contents) => {
      console.log('Cons innards', contents);
      return `<p>Cons: ${escapeHtml(contents)}</p>`
    }
  ),

  statement: new TagStreamProcessor(
    SPECIAL_CHARACTERS.statement,
    SPECIAL_CHARACTERS.statement + '<statement>',
    '</statement>',
    SPECIAL_CHARACTERS.loading,
    async (contents) => {
      console.log('Statement innards', contents);
      return `<p>Statement: ${escapeHtml(contents)}</p>`;
    }
  ),

  supportLikelihood: new TagStreamProcessor(
    SPECIAL_CHARACTERS.likelihood,
    SPECIAL_CHARACTERS.likelihood + '<support_likelihood>',
    '</support_likelihood>',
    SPECIAL_CHARACTERS.loading,
    async (contents) => {
      console.log('Likelihood innards', contents);
      return `<p>Likelihood of Support: ${escapeHtml(contents)}</p>`;
    }
  )
});

export default genProcessors;