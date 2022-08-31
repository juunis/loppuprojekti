jest.mock('./apu.js');
const { luoAikaleima, fetchLatest } = require('./apu.js');


test('should get rss feed', async () => {
    const items = { title: 'testititle', contentSnippet: 'test 2' };
    const feed = { title: 'test', items: items }; // expected 
    fetchLatest.mockImplementation(() => ({ title: 'test', items: { title: 'testititle', contentSnippet: 'test 2'}}),
    ); // received
    
    const result = await fetchLatest();

    //expect(result.description).toEqual(feedConfig.description);
    expect(result).toEqual(feed);
    expect(result.items).toEqual(items);
})

test('testaa aikaleima', async () => {
    const aikaleima = '2022-08-30t11.00'; // expected 
    luoAikaleima.mockImplementation(() => ('2022-08-30t11.00')); // received
    
    const result = luoAikaleima();

    expect(result).toEqual(aikaleima);
})
