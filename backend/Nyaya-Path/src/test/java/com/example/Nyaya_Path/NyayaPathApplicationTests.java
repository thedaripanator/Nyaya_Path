package com.example.Nyaya_Path;

import com.example.Nyaya_Path.Repository.LegalSectionRepository;
import com.example.Nyaya_Path.Service.LegalSectionService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

@SpringBootTest
class NyayaPathApplicationTests {

	@Autowired
	private LegalSectionRepository legalSectionRepository;

	@Autowired
	private LegalSectionService legalSectionService;

	@Test
	void contextLoads() {
	}

	@Test
	void sectionSearchPageSupportsSectionNumberSearch() {
		Assertions.assertNotNull(legalSectionRepository.searchPage(
				"All",
				null,
				"1",
				PageRequest.of(0, 1)
		));
	}

	@Test
	void englishSectionPageKeepsOriginalTextAndReturnsAllTranslationFields() {
		var page = legalSectionService.getSectionsPage("All", 0, 1, "en", "");
		var section = page.content().get(0);

		Assertions.assertNotNull(section.act());
		Assertions.assertNotNull(section.translatedAct());
		Assertions.assertNotNull(section.translatedSectionTitle());
		Assertions.assertNotNull(section.translatedChapter());
		Assertions.assertNotNull(section.translatedContext());
		Assertions.assertNotNull(section.translatedText());
		Assertions.assertNotNull(section.originalText());
	}

}
