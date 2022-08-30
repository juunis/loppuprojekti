jest.mock('./apu.js');
const { fetchLatest } = require('./apu.js');


test('should get rss feed', async () => {
    const items = { title: 'test', contentSnippet: 'test 2' };
    const feed = { title: 'test', items: items }; // expected 
    fetchLatest.mockImplementation(() => ({ title: 'test', contentSnippet: 'test 2' }),
    ); // received
    
    const result = await fetchLatest();

    //expect(result.description).toEqual(feedConfig.description);
    expect(result).toEqual(feed.items);
    //expect(result.items).toEqual(items);
})
